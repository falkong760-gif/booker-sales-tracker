import time
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Create context to preserve session storage / cookies
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Log console messages
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: [{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER EXCEPTION: {err.message}"))
        page.on("requestfailed", lambda req: print(f"BROWSER REQUEST FAILED: {req.method} {req.url}"))

        print("Navigating to login page...")
        page.goto("http://localhost:3003/login")
        time.sleep(4)

        print("Filling login details...")
        page.fill("input[type='email']", "booker@gmail.com")
        page.fill("input[type='password']", "booker@@")

        print("Clicking submit...")
        page.click("button[type='submit']")

        print("Waiting for page transition...")
        # Wait up to 15 seconds for URL to contain /dashboard
        try:
            page.wait_for_url("**/dashboard", timeout=15000)
            print("Successfully redirected to dashboard!")
            print("Giving the dashboard time to load its dynamic components...")
            time.sleep(6)
        except Exception as e:
            print("Failed to redirect to dashboard:", str(e))

        print("Current URL is:", page.url)
        page.screenshot(path="/home/jules/verification/owner_dashboard_live_light.png")

        # Toggle dark mode
        theme_button = page.locator("button[aria-label='Toggle theme mode']")
        if theme_button.count() > 0:
            theme_button.first.click()
            time.sleep(2)
            print("Taking dark mode screenshot...")
            page.screenshot(path="/home/jules/verification/owner_dashboard_live_dark.png")
        else:
            print("Theme toggler not found via aria-label!")

        browser.close()

if __name__ == "__main__":
    run()
