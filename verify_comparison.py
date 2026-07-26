import sys
import os
import asyncio
from playwright.async_api import async_playwright

async def verify_comparison_flow():
    print("Launching Playwright...")
    async with async_playwright() as p:
        # Launch browser headlessly
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1600})
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
        await page.click("button[type='submit']")

        # Wait for redirect to /dashboard
        print("Waiting for redirection to /dashboard...")
        await page.wait_for_url("**/dashboard", timeout=12000)

        # Navigate to /comparison
        print("Navigating to /comparison ...")
        await page.goto("http://localhost:3003/comparison")
        await page.wait_for_timeout(4000)

        print(f"Arrived on Booker Comparison Page: {page.url}")

        # Ensure directory for screenshots exists
        os.makedirs("./verification", exist_ok=True)

        # --- 1. TEST DATE RANGE BOUNDS VALIDATION ERROR ---
        print("Entering invalid date range bounds to trigger warnings...")
        # Get today YYYY-MM-DD
        today = await page.locator("input[type='date'] >> nth=1").input_value()
        year, month, day = map(int, today.split('-'))
        import datetime
        tomorrow = (datetime.date(year, month, day) + datetime.timedelta(days=1)).isoformat()

        # Set start date > end date
        await page.fill("input[type='date'] >> nth=0", tomorrow)
        await page.wait_for_timeout(1000)

        screenshot_validation = "./verification/20_comparison_date_validation.png"
        print(f"Capturing screenshot of invalid date validation warning banner: {screenshot_validation}")
        await page.screenshot(path=screenshot_validation)

        # Revert dates to valid ranges
        print("Reverting dates to valid current month scope...")
        now = datetime.date(year, month, day)
        first_of_month = datetime.date(year, month, 1).isoformat()
        await page.fill("input[type='date'] >> nth=0", first_of_month)
        await page.fill("input[type='date'] >> nth=1", today)
        await page.wait_for_timeout(2000)

        # --- 2. HOVER TO SHOW THE CUSTOM GLASS TOOLTIP ON COMPARISON BAR CHART ---
        print("Hovering over Bar Chart rectangle to display custom glass tooltip...")
        try:
            bars = page.locator(".recharts-bar-rectangle").first
            await bars.hover()
            await page.wait_for_timeout(1000)
            print("Successfully hovered over bar element.")
        except Exception as err:
            print(f"Could not hover bar precisely: {err}")

        # Capture Light Mode screenshot
        screenshot_light = "./verification/21_comparison_light.png"
        print(f"Capturing screenshot of Comparison Dashboard (Light Mode): {screenshot_light}")
        await page.screenshot(path=screenshot_light)

        # --- 3. TEST DARK MODE SWAP ---
        print("Toggling dark mode...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(1000)

        screenshot_dark = "./verification/22_comparison_dark.png"
        print(f"Capturing screenshot of Comparison Dashboard (Dark Mode): {screenshot_dark}")
        await page.screenshot(path=screenshot_dark)

        # Toggle back to light
        print("Toggling back to light mode...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(500)

        # --- 4. TEST MOBILE VIEWPORT ---
        print("Setting mobile viewport size (375x1800) to verify vertical scroll stack...")
        await page.set_viewport_size({"width": 375, "height": 1800})
        await page.wait_for_timeout(1000)

        screenshot_mobile = "./verification/23_comparison_mobile.png"
        print(f"Capturing screenshot of mobile Comparison stack: {screenshot_mobile}")
        await page.screenshot(path=screenshot_mobile)

        print("Verification complete!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_comparison_flow())
