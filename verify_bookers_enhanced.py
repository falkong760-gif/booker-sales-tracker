import sys
import os
import asyncio
from playwright.async_api import async_playwright

async def verify_bookers_flow():
    print("Launching Playwright...")
    async with async_playwright() as p:
        # Launch browser headlessly
        browser = await p.chromium.launch(headless=True)

        # Set viewport for desktop
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # Listen to console logs
        page.on("console", lambda msg: print(f"[BROWSER CONSOLE] {msg.type}: {msg.text}"))

        # Nav to Login
        print("Navigating to http://localhost:3003/login ...")
        await page.goto("http://localhost:3003/login")
        await page.wait_for_timeout(2000)

        # Fill credentials
        print("Entering credentials...")
        await page.fill("#email", "booker@gmail.com")
        await page.fill("#password", "booker@@")

        # Click login button
        print("Submitting login form...")
        await page.click("button[type='submit']")

        # Wait for redirect to /dashboard
        print("Waiting for redirection to /dashboard...")
        try:
            await page.wait_for_url("**/dashboard", timeout=12000)
        except Exception as e:
            print(f"Redirection timed out: {e}")
            sys.exit(1)

        current_url = page.url
        print(f"Current URL after login: {current_url}")

        # Now navigate to /bookers
        print("Navigating to /bookers ...")
        await page.goto("http://localhost:3003/bookers")
        await page.wait_for_timeout(3000)

        current_url = page.url
        print(f"Current URL on Bookers page: {current_url}")
        if "/bookers" not in current_url:
            print("Failed to navigate to bookers page. Exiting.")
            sys.exit(1)

        # Ensure directory for screenshots exists
        os.makedirs("./verification", exist_ok=True)

        # 1. Open the Add Booker slide-over panel
        print("Clicking 'Add Booker' button to open slide-over panel...")
        await page.click("button:has-text('Add Booker')")
        await page.wait_for_timeout(1000)

        # 2. Fill in invalid details to show Validation Error State
        print("Entering invalid details for validation error testing...")
        await page.fill("input[placeholder='e.g. Hammad Khan']", "A") # short name
        await page.fill("input[placeholder='e.g. hammad@gmail.com']", "invalidemail") # invalid email
        await page.fill("input[placeholder='e.g. +92 300 1234567']", "123") # short phone

        print("Clicking 'Save Profile' to trigger validation error...")
        await page.click("button:has-text('Save Profile')")
        await page.wait_for_timeout(1000)

        # Capture validation error screenshot
        screenshot_validation_error = "./verification/02_validation_error_light.png"
        print(f"Capturing screenshot of validation error inside drawer: {screenshot_validation_error}")
        await page.screenshot(path=screenshot_validation_error)

        # 3. Correct the inputs to show Drawer open with form in Light mode
        print("Filling out form with valid data...")
        await page.fill("input[placeholder='e.g. Hammad Khan']", "Hammad Khan")
        await page.fill("input[placeholder='e.g. hammad@gmail.com']", "hammad_khan_test@gmail.com")
        await page.fill("input[placeholder='e.g. +92 300 1234567']", "+92 300 1234567")
        await page.wait_for_timeout(500)

        # Capture drawer form state
        screenshot_drawer = "./verification/01_add_booker_drawer_light.png"
        print(f"Capturing screenshot of slide-over drawer: {screenshot_drawer}")
        await page.screenshot(path=screenshot_drawer)

        # 4. Save and trigger Concise Success Toast and Separate Credentials display
        print("Saving profile to trigger success toast and credentials container...")
        await page.click("button:has-text('Save Profile')")
        await page.wait_for_timeout(3000)

        # Capture success toast and separate monospace credentials card
        screenshot_success = "./verification/03_creation_success_toast_light.png"
        print(f"Capturing screenshot of creation success toast: {screenshot_success}")
        await page.screenshot(path=screenshot_success)

        # 5. Toggle Dark Mode via Topbar actual button
        print("Toggling dark mode via Topbar button...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(1500)

        # Capture Dark Mode view
        screenshot_dark = "./verification/04_bookers_management_dark.png"
        print(f"Capturing screenshot of bookers management page in dark mode: {screenshot_dark}")
        await page.screenshot(path=screenshot_dark)

        # 6. Mobile View (switch viewport and back to light mode for contrast)
        print("Toggling back to light mode...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(1000)

        print("Setting viewport to mobile size (375x812)...")
        await page.set_viewport_size({"width": 375, "height": 812})
        await page.wait_for_timeout(1500)

        # Capture Mobile view
        screenshot_mobile = "./verification/05_bookers_management_mobile.png"
        print(f"Capturing screenshot of mobile view: {screenshot_mobile}")
        await page.screenshot(path=screenshot_mobile)

        print("Playwright flow successfully complete!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_bookers_flow())
