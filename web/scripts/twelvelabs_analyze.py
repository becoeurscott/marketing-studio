"""Analyze one marketing video with Twelve Labs (Pegasus 1.5).

Usage: python3 web/scripts/twelvelabs_analyze.py [VIDEO_URL]
Reads TWELVELABS_API_KEY from web/.env.local.
"""
import json
import os
import sys
import time

from twelvelabs import TwelveLabs
from twelvelabs.types import AnalyzePromptV2, VideoContext_Url

ENV = os.path.join(os.path.dirname(__file__), "..", ".env.local")
DEFAULT_VIDEO = "https://zyg59zew.insforge.site/showcase/ugc/temoignage-karite.mp4"

PROMPT = (
    "Tu analyses une vidéo marketing pour un petit commerce africain. "
    'Réponds uniquement en JSON : {"produit_visible": bool, "produit": string, '
    '"legende_whatsapp": string (2 phrases max, en français), "hashtags": [5 strings]}'
)


def api_key() -> str:
    key = os.environ.get("TWELVELABS_API_KEY")
    if not key and os.path.exists(ENV):
        for line in open(ENV):
            if line.startswith("TWELVELABS_API_KEY="):
                key = line.split("=", 1)[1].strip().strip('"')
    if not key:
        sys.exit("TWELVELABS_API_KEY manquant dans web/.env.local")
    return key


def main() -> None:
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_VIDEO
    client = TwelveLabs(api_key=api_key())
    task = client.analyze_async.tasks.create(
        model_name="pegasus1.5",
        video=VideoContext_Url(url=url),
        prompt_v_2=AnalyzePromptV2(input_text=PROMPT),
        temperature=0.2,
    )
    print(f"Tâche {task.task_id} lancée sur {url}")
    while True:
        task = client.analyze_async.tasks.retrieve(task.task_id)
        if task.status == "ready":
            break
        if task.status in ("failed", "canceled"):
            sys.exit(f"Analyse {task.status}")
        time.sleep(5)
    data = task.result.data
    try:
        print(json.dumps(json.loads(data), ensure_ascii=False, indent=2))
    except (TypeError, ValueError):
        print(data)


if __name__ == "__main__":
    main()
