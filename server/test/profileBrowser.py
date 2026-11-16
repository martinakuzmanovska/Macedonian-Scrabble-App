"""Real Chrome regression flow. Requires local MongoDB, client/dist, and websocket-client.

Run from the repository root: python server/test/profileBrowser.py
Uses two isolated browser contexts and an isolated database; never uses real accounts.
The fixture signs users in through Passport, skipping only external Google consent.
"""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.request

import websocket


ROOT = Path(__file__).resolve().parents[2]
CHROME = os.environ.get("CHROME_PATH", r"C:\Program Files\Google\Chrome\Application\chrome.exe")


class Browser:
    def __init__(self, directory):
        self.process = subprocess.Popen([
            CHROME, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
            "--remote-debugging-port=0", f"--user-data-dir={directory}", "about:blank",
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        port_file = Path(directory) / "DevToolsActivePort"
        deadline = time.monotonic() + 15
        while not port_file.exists():
            if time.monotonic() > deadline:
                raise RuntimeError("Chrome did not expose DevTools")
            time.sleep(0.1)
        port, path = port_file.read_text().splitlines()[:2]
        self.socket = websocket.create_connection(f"ws://127.0.0.1:{port}{path}", suppress_origin=True, timeout=20)
        self.sequence = 0

    def call(self, method, params=None, session=None):
        self.sequence += 1
        message = {"id": self.sequence, "method": method, "params": params or {}}
        if session:
            message["sessionId"] = session
        self.socket.send(json.dumps(message))
        while True:
            response = json.loads(self.socket.recv())
            if response.get("id") == self.sequence:
                if "error" in response:
                    raise RuntimeError(response["error"])
                return response.get("result", {})

    def page(self, url):
        context = self.call("Target.createBrowserContext")["browserContextId"]
        target = self.call("Target.createTarget", {"url": "about:blank", "browserContextId": context})["targetId"]
        session = self.call("Target.attachToTarget", {"targetId": target, "flatten": True})["sessionId"]
        self.navigate(session, url)
        return session

    def navigate(self, page, url):
        if self.evaluate(page, "location.href") == url:
            self.call("Page.reload", {"ignoreCache": True}, page)
        else:
            self.call("Page.navigate", {"url": url}, page)
        self.wait(page, "document.readyState === 'complete'")

    def evaluate(self, page, expression):
        result = self.call("Runtime.evaluate", {"expression": expression, "awaitPromise": True, "returnByValue": True}, page)
        if "exceptionDetails" in result:
            raise RuntimeError(result["exceptionDetails"])
        return result.get("result", {}).get("value")

    def wait(self, page, expression, timeout=15):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if self.evaluate(page, expression):
                return
            time.sleep(0.15)
        raise AssertionError(f"Timed out: {expression}\n{self.evaluate(page, 'document.body.innerText')}")

    def click(self, page, text):
        self.evaluate(page, f"Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes({json.dumps(text)})).click()")

    def api(self, page, path, body=None):
        options = {"credentials": "include"}
        if body is not None:
            options.update(method="POST", headers={"Content-Type": "application/json"}, body=json.dumps(body))
        return self.evaluate(page, f"(async () => {{ const r = await fetch({json.dumps(path)}, {json.dumps(options)}); return {{ status: r.status, data: await r.json() }}; }})()")

    def close(self):
        try:
            self.call("Browser.close")
        except (OSError, websocket.WebSocketException):
            pass
        self.socket.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.terminate()


def run():
    fixture = subprocess.Popen(["node", "server/test/browserFixture.js"], cwd=ROOT,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8",
                               creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    browser = None
    base = None
    directory = tempfile.TemporaryDirectory(prefix="scrabble-browser-")
    try:
        line = fixture.stdout.readline()
        if not line:
            raise RuntimeError(fixture.stderr.read())
        base = json.loads(line)["fixtureUrl"]
        browser = Browser(directory.name)
        a, b = browser.page(base), browser.page(base)
        for index, page in enumerate([a, b]):
            assert browser.api(page, f"/__test/login/{index}", {})["status"] == 200
            browser.navigate(page, base)
            browser.wait(page, "!!document.querySelector('.app-navbar-name')")
        browser.click(a, "Играј со играч")
        browser.wait(a, "!!sessionStorage.getItem('mk-scrabble-gameid')")
        game_id = browser.evaluate(a, "sessionStorage.getItem('mk-scrabble-gameid')")
        assert browser.api(a, f"/__test/rack/{game_id}", {})["status"] == 200
        browser.navigate(b, f"{base}/?join={game_id}")
        browser.wait(a, "document.querySelectorAll('.tile-rack').length === 7")
        browser.wait(b, "document.querySelectorAll('.board-cell').length === 225")

        def place(row, letters):
            for col, letter in enumerate(letters, start=7):
                browser.evaluate(a, f"Array.from(document.querySelectorAll('.tile-rack')).find(e => e.firstChild.textContent.trim() === {json.dumps(letter)}).click()")
                browser.wait(a, "!!document.querySelector('.scrabble-tile--selected')")
                browser.evaluate(a, f"document.querySelectorAll('.board-cell')[{row * 15 + col}].click()")
                browser.wait(a, "!document.querySelector('.scrabble-tile--selected')")
            browser.click(a, "Потврди")
            browser.wait(b, "Array.from(document.querySelectorAll('button')).some(e => e.textContent.includes('🔍'))")

        def resolve(word):
            browser.evaluate(b, f"Array.from(document.querySelectorAll('button')).find(e => e.textContent.includes('🔍') && e.parentElement.textContent.includes({json.dumps(word)})).click()")
            browser.wait(b, "Array.from(document.querySelectorAll('button')).some(e => ['Продолжи', 'ОК'].includes(e.textContent.trim()))")

        def close_result():
            browser.evaluate(b, "Array.from(document.querySelectorAll('button')).find(e => ['Продолжи', 'ОК'].includes(e.textContent.trim())).click()")

        place(7, "МА")
        pending = browser.api(b, f"/api/games/{game_id}")["data"]["state"]
        resolve("МА")
        close_result()
        browser.wait(a, "document.querySelectorAll('.tile-rack').length === 7")
        first_state = browser.api(a, f"/api/games/{game_id}")["data"]["state"]
        assert first_state["currentPlayerIndex"] == 0
        assert first_state["players"][0]["score"] > 0
        assert first_state["board"] == first_state["confirmedBoard"]
        assert browser.api(a, "/api/auth/me/dictionary")["data"]["words"] == []
        assert len(browser.api(b, "/api/auth/me/dictionary")["data"]["words"]) == 1
        # Repeating the exact challenge must not replay the penalty or score.
        assert browser.api(b, f"/api/games/{game_id}/challenge-result", {"pendingMoveId": pending["pendingMoveId"], "wordIndex": 0})["status"] == 200
        assert browser.api(a, f"/api/games/{game_id}")["data"]["state"] == first_state
        print("PASS browser: create/join, place/confirm, valid challenge and retry", flush=True)

        place(8, "МА")
        resolve("МА")
        close_result()
        browser.wait(a, "document.querySelectorAll('.tile-rack').length === 7")
        words = browser.api(b, "/api/auth/me/dictionary")["data"]["words"]
        assert len(words) == 1 and len(words[0]["history"]) == 2
        assert all(event["gameId"] == game_id and event["author"]["displayName"] == "Ана тест" for event in words[0]["history"])
        before_invalid = browser.api(a, f"/api/games/{game_id}")["data"]["state"]
        place(9, "ЖЖ")
        resolve("ЖЖ")
        close_result()
        browser.wait(b, "document.querySelectorAll('.tile-rack').length === 7")
        browser.wait(a, "document.querySelectorAll('.tile-rack').length === 0")
        after_invalid = browser.api(a, f"/api/games/{game_id}")["data"]["state"]
        assert after_invalid["board"] == before_invalid["confirmedBoard"]
        assert after_invalid["players"][0]["score"] == before_invalid["players"][0]["score"]
        assert [p["rack"] for p in after_invalid["players"]] == [p["rack"] for p in before_invalid["players"]]
        assert browser.api(b, f"/api/games/{game_id}")["data"]["state"] == after_invalid
        print("PASS browser: same-game repeated word, multiple words, invalid challenge, polling updates", flush=True)

        browser.click(b, "Мој профил")
        browser.wait(b, "document.querySelectorAll('.profile-word').length === 1")
        for search in ["НЕПОСТОЕЧКИ", "МА", "ма", "Ма"]:
            browser.evaluate(b, f"(() => {{ const input = document.querySelector('#dictionary-search'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, {json.dumps(search)}); input.dispatchEvent(new Event('input', {{ bubbles: true }})); }})()")
            expected = 0 if search == "НЕПОСТОЕЧКИ" else 1
            browser.wait(b, f"document.querySelectorAll('.profile-word').length === {expected}")
        browser.evaluate(b, "document.querySelector('.profile-word summary').click()")
        browser.wait(b, "document.querySelectorAll('.profile-challenges li').length === 2")
        assert "Ана тест" in browser.evaluate(b, "document.querySelector('.profile-challenges').innerText")
        browser.navigate(b, f"{base}/#profile")
        browser.wait(b, "document.querySelectorAll('.profile-word').length === 1")
        assert browser.evaluate(b, "document.querySelectorAll('.profile-challenges li').length") == 2
        browser.click(b, "Затвори")
        # Exercise real UI loading/error/retry paths without altering stored data.
        browser.evaluate(b, "window.savedFetch = window.fetch; window.fetch = (url, options) => url === '/api/auth/me/dictionary' ? Promise.resolve(new Response('{}', { status: 503 })) : window.savedFetch(url, options)")
        browser.click(b, "Мој профил")
        browser.wait(b, "!!document.querySelector('.profile-dialog [role=alert]')")
        assert "Речникот не може да се вчита" in browser.evaluate(b, "document.querySelector('.profile-dialog').innerText")
        browser.evaluate(b, "window.fetch = window.savedFetch")
        browser.click(b, "Обиди се повторно")
        browser.wait(b, "document.querySelectorAll('.profile-word').length === 1")
        browser.click(b, "Затвори")
        browser.evaluate(b, "window.fetch = (url, options) => url === '/api/auth/me/dictionary' ? new Promise(resolve => { window.finishDictionaryRead = () => resolve(new Response(JSON.stringify({ success: true, words: [{ word: 'STALE PRIVATE WORD', normalizedWord: 'stale', definition: 'private', history: [] }] }))); }) : window.savedFetch(url, options)")
        browser.click(b, "Мој профил")
        browser.wait(b, "!!document.querySelector('.profile-dialog [aria-busy=true]')")
        browser.click(b, "Затвори")
        browser.evaluate(b, "window.fetch = window.savedFetch; window.finishDictionaryRead()")
        assert not browser.evaluate(b, "!!document.querySelector('.profile-word')")
        browser.click(b, "Logout")
        browser.wait(b, "!document.querySelector('.app-navbar-name')")
        assert browser.evaluate(b, "!document.querySelector('.profile-word')")
        browser.navigate(b, f"{base}/#profile")
        browser.wait(b, "!!document.querySelector('.login-google-button')")
        assert not browser.evaluate(b, "!!document.querySelector('.profile-dialog')")
        assert browser.api(b, "/api/auth/me/dictionary")["status"] == 401
        # Switch to A in the same browser context; B's dictionary must disappear.
        assert browser.api(b, "/__test/login/0", {})["status"] == 200
        browser.navigate(b, f"{base}/#profile")
        browser.wait(b, "!!document.querySelector('.profile-state') && !document.querySelector('[aria-busy=true]')")
        assert browser.evaluate(b, "document.querySelector('#profile-title').textContent") == "Ана тест"
        assert browser.evaluate(b, "document.querySelectorAll('.profile-word').length") == 0
        print("PASS browser: private profile, case-insensitive search, history, refresh, logout and account switch", flush=True)
    finally:
        if browser:
            browser.close()
        if base:
            try:
                request = urllib.request.Request(base + "/__test/shutdown", data=b"{}", headers={"Content-Type": "application/json"})
                urllib.request.urlopen(request, timeout=5).close()
                fixture.wait(timeout=10)
            except Exception:
                fixture.terminate()
        else:
            fixture.terminate()
        try:
            directory.cleanup()
        except PermissionError:
            pass


if __name__ == "__main__":
    run()
