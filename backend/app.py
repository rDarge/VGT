from fastapi import FastAPI, File, UploadFile, Body, BackgroundTasks
from manga_ocr import MangaOcr
import io
from PIL import Image
import time
import base64
from huggingface_hub import scan_cache_dir
import psutil
import sys
import multiprocessing
import os
import signal
import openai
import winsdk
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.globalization import Language
from winsdk.windows.storage.streams import DataWriter
from winsdk.windows.graphics.imaging import SoftwareBitmap, BitmapPixelFormat

# Process in charge of stopping the FastApi worker in case electron.exe (or VGT.exe) ceases to exist. 
# This process self-terminates in case the parent process ceases to exist. 
# The check is carried out every 2 seconds.

def watcher(parent_pid):
    while True:
        info = []
        parentRunning = False
        for proc in psutil.process_iter():
            # TODO: Use "electron.exe"|"Electron|electron" for dev(win|mac|linux) and "VGT.exe" for prod
            if proc.name() == "electron.exe" or proc.name() == "VGT.exe" or proc.name() == "Electron" or proc.name() == "electron":
                info.append(str(proc))
            if proc.pid == parent_pid:
                parentRunning = True
        if parentRunning is False:
            raise SystemExit
        if (len(info) == 0):
            # Although this instruction terminates the process correctly, it is considered an asyncio-level error.
            os.kill(parent_pid, signal.SIGTERM)
            raise SystemExit
        time.sleep(1)

def recognize_bytes(bytes, width, height, lang='en'):
    cmd = 'Add-WindowsCapability -Online -Name "Language.OCR~~~en-US~0.0.1.0"'
    assert OcrEngine.is_language_supported(Language(lang)), cmd
    writer = DataWriter()
    writer.write_bytes(bytes)
    sb = SoftwareBitmap.create_copy_from_buffer(writer.detach_buffer(), BitmapPixelFormat.RGBA8, width, height)
    return OcrEngine.try_create_from_language(Language(lang)).recognize_async(sb)


app = FastAPI()

mocr = None

# Supply "standalone" as a command line argument to run without the corresponding electron task
standalone = False
if len(sys.argv) == 2:
    if sys.argv[1] == "standalone":
        standalone = True

# When starting FastApi we generate a child process to which we pass the parent's pid (that is, this process)
# This child process will be in charge of verifying that electron is being executed, if it is not, this process is in charge of killing the parent (that is, this process).
# This logic only applies when we are running the backend in *no* standalone mode.
# This solution should be applied given the problem of orphaned python processes spawned when the main application is closed under some special conditions
# These orphaned processes are not terminated and block the ability to run the application again
if standalone is False:
    @app.on_event("startup")
    def watchElectron():
        parent_pid = os.getpid()
        bye_process = multiprocessing.Process(
            target=watcher, args=(parent_pid,))
        bye_process.start()


@app.get("/check")
def check():
    return "ok"


@app.get("/modelCheck")
def model_check():
    hf_cache_info = scan_cache_dir()
    for repo in hf_cache_info.repos:
        if repo.repo_id == "kha-white/manga-ocr-base":
            # Note: We specify not only that there is at least one revision, but also that there are 6 or more files. This is in case of interrupted downloads
            if len(repo.revisions) > 0 and repo.nb_files >= 6:
                return "inDisk"
    return "notInDisk"


# Start the MangaOcr loading process
# Known bug: if the download process is interrupted in dev, there is a python process that does not allow a reboot
@app.post("/loadMangaOCR")
def load_manga_ocr():
    print("loadMangaOCR")
    global mocr
    if mocr is None:
        mocr = MangaOcr()
        return {"msg": "Manga OCR Ready"}
    else:
        return {"msg": "MangaOCR has already been loaded"}


@app.post("/translateDataUrlImg")
async def translate_dataurl_img(data: dict):
    global mocr
    if mocr is None:
        mocr = MangaOcr()
    imagen_decodificada = base64.b64decode(data["img"].split(",")[1])
    with Image.open(io.BytesIO(imagen_decodificada)) as image:
        # text = (await winocr.recognize_pil(image, 'ja')).text
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        result = await recognize_bytes(image.tobytes(), image.width, image.height, 'ja')
        text = result.text
        # text = mocr(image)
    return {"id": data["id"], "text": text}


@app.post("/translateText")
async def translate_text(data: dict):
    if data["config"]["openaiApiKey"] == '':
        return {"id": data["id"], "trad": ""}
    else:
        if data["config"]["selectedOpenAiModel"]["fullname"] == "text-davinci-003":
            openai.api_key = data["config"]["openaiApiKey"]
            completion = openai.Completion.create(
                engine="text-davinci-003",
                prompt=data["config"]["basePrompt"] + '"' + data["text"] + '"',
                max_tokens=200,
                temperature=0.3,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )
            return {"id": data["id"], "trad": completion.choices[0].text.strip()}
        elif data["config"]["selectedOpenAiModel"]["fullname"] == "gpt-3.5-turbo":
            openai.api_key = data["config"]["openaiApiKey"]
            chat = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": data["config"]
                           ["basePrompt"] + '"' + data["text"] + '"'}],
                # max_tokens=200,
                # temperature=0.3,
                # top_p=1,
                # frequency_penalty=0,
                # presence_penalty=0
            )
            return {"id": data["id"], "trad": chat.choices[0].message.content.strip()}

        else:
            return {"id": data["id"], "trad": ""}

# Returns a text detected from a sample image using Manga OCR

@ app.get("/test")
def test():
    print("test")
    global mocr
    if mocr is None:
        return {"msg": "Manga OCR not Ready"}
    # TODO: This Path is a problem, as it works in dev but not in prod
    text = mocr('backend/img/00.jpg')
    return {"Test": text}


# Requires loading the model again after cleaning
@ app.post("/cleanMangaOCRCache")
def clean_manga_orc_cache():
    print("cleanMangaOCRCache")
    global mocr
    hf_cache_info = scan_cache_dir()
    for repo in hf_cache_info.repos:
        if repo.repo_id == "kha-white/manga-ocr-base":  # We only remove revisions from the manga-ocr model
            for revision in repo.revisions:
                scan_cache_dir().delete_revisions(revision.commit_hash).execute()
    mocr = None
    return {"msg": "Manga OCR cache model deleted"}


@ app.get("/ping")
def ping():
    print("jusdc  ccd")
    return "ping"
