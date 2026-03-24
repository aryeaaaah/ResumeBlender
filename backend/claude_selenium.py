import time
import os
import json
import re
import pyperclip
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.edge.options import Options
from selenium.webdriver.edge.service import Service

# ── Config ────────────────────────────────────────────────────────────────────
CLAUDE_URL      = "https://claude.ai"
DRIVER_PATH     = os.path.join(os.path.dirname(__file__), "msedgedriver.exe")
PROFILE_PATH    = os.path.join(os.path.dirname(__file__), "edge_profile_2")
PROMPTS_DIR     = os.path.join(os.path.dirname(__file__), "prompts")

# ── Singleton driver ──────────────────────────────────────────────────────────
_driver = None

def get_driver():
    global _driver
    if _driver is not None:
        try:
            _ = _driver.title  # check if still alive
            return _driver
        except:
            _driver = None

    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(f"--user-data-dir={PROFILE_PATH}")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    _driver = webdriver.Edge(
        service=Service(DRIVER_PATH),
        options=options
    )
    _driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return _driver


def close_driver():
    global _driver
    if _driver:
        _driver.quit()
        _driver = None


# ── Login ─────────────────────────────────────────────────────────────────────
def open_and_login():
    """
    Opens Claude in Edge. Since this is called from FastAPI (no terminal),
    login confirmation is handled differently — see notes in main.py.
    Returns the driver once called.
    """
    driver = get_driver()
    driver.get(CLAUDE_URL)
    time.sleep(3)
    return driver


def confirm_login():
    """
    Called by the frontend login-confirm endpoint after the user
    clicks 'I have logged in' in the UI.
    Just verifies the page looks right.
    """
    driver = get_driver()
    try:
        driver.find_element(By.CSS_SELECTOR, 'div[contenteditable="true"]')
        return True
    except:
        return False


# ── New chat ──────────────────────────────────────────────────────────────────
def start_new_chat():
    driver = get_driver()
    try:
        incognito_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[aria-label="Use incognito"]'))
        )
        incognito_btn.click()
        print(">>> Incognito chat started")
        time.sleep(2)
    except Exception as e:
        print(f">>> Incognito button not found ({e}), navigating to /new...")
        driver.get(CLAUDE_URL + "/new")
        time.sleep(3)


# ── Send prompt ───────────────────────────────────────────────────────────────
def send_prompt(text: str):
    driver = get_driver()
    wait = WebDriverWait(driver, 20)
    composer = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'div[contenteditable="true"]'))
    )
    composer.click()
    time.sleep(0.5)

    pyperclip.copy(text)
    composer.send_keys(Keys.CONTROL, 'v')
    print(">>> Prompt pasted. Sending...")
    time.sleep(0.5)
    composer.send_keys(Keys.ENTER)


# ── Wait for response ─────────────────────────────────────────────────────────
def wait_for_response(timeout=180):
    driver = get_driver()
    print(">>> Waiting for Claude to respond...")
    time.sleep(3)

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'button[aria-label="Stop"]'))
        )
        print(">>> Claude is generating...")
    except:
        print(">>> Stop button not detected — may have responded instantly")

    try:
        WebDriverWait(driver, timeout).until(
            EC.invisibility_of_element_located((By.CSS_SELECTOR, 'button[aria-label="Stop"]'))
        )
        print(">>> Claude finished responding")
    except:
        print(">>> Timeout — extracting whatever is there")

    time.sleep(2)


# ── Extract response ──────────────────────────────────────────────────────────
def extract_response() -> str:
    driver = get_driver()
    selectors = [
        '.font-claude-response',
        '[data-testid="assistant-message"]',
        '.font-claude-message',
        'div.prose',
    ]
    for sel in selectors:
        elements = driver.find_elements(By.CSS_SELECTOR, sel)
        if elements:
            last = elements[-1]
            code_blocks = last.find_elements(By.CSS_SELECTOR, 'pre code')
            if code_blocks:
                text = driver.execute_script(
                    "return arguments[0].innerText;", code_blocks[-1]
                ).strip()
            else:
                text = last.text.strip()
            print(f">>> Extracted using: {sel}")
            return text

    raise Exception("Could not find Claude's response — selectors may need updating.")


# ── Parse JSON from response ──────────────────────────────────────────────────
def parse_json(raw: str) -> dict:
    # Direct parse
    try:
        return json.loads(raw)
    except:
        pass

    # Strip markdown fences
    cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except:
        pass

    # Find first { ... } block
    match = re.search(r'\{[\s\S]*\}', cleaned)
    if match:
        try:
            return json.loads(match.group())
        except:
            pass

    raise ValueError(f"Could not parse JSON from response:\n{raw[:500]}")


# ── Load and fill prompt template ─────────────────────────────────────────────
def load_prompt(filename: str, replacements: dict) -> str:
    path = os.path.join(PROMPTS_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    for key, value in replacements.items():
        content = content.replace(key, value)
    return content


# ── High-level task functions (called by main.py) ─────────────────────────────
def run_score(resume_text: str, job_description: str) -> dict:
    prompt = load_prompt("ResumeScoring.pmt", {
        "[TEMPLATE_RESUME_CONTENT]":      resume_text,
        "[TEMPLATE_JOB_DESCRIPTION_CONTENT]": job_description,
    })
    start_new_chat()
    send_prompt(prompt)
    wait_for_response()
    raw = extract_response()
    return parse_json(raw)


def run_tailor(resume_text: str, job_description: str, guidelines: str) -> dict:
    prompt = load_prompt("ResumeTailor.pmt", {
        "[TEMPLATE_RESUME_CONTENT]":      resume_text,
        "[TEMPLATE_JOB_DESCRIPTION_CONTENT]": job_description,
        "[TEMPLATE_GUIDELINES_CONTENT]":  guidelines,
    })
    start_new_chat()
    send_prompt(prompt)
    wait_for_response()
    raw = extract_response()
    return parse_json(raw)


def run_cover_letter(job_description: str, resume_json: dict) -> dict:
    prompt = load_prompt("CoverLetter.pmt", {
        "[TEMPLATE_JOB_DESCRIPTION_CONTENT]": job_description,
        "[TEMPLATE_RESUME_JSON]":             json.dumps(resume_json, indent=2),
    })
    start_new_chat()
    send_prompt(prompt)
    wait_for_response()
    raw = extract_response()
    return parse_json(raw)