import sys
import os
import asyncio
import re
from playwright.async_api import async_playwright

async def verify_booker_detail_flow():
    print("Launching Playwright...")
    async with async_playwright() as p:
        # Launch browser headlessly
        browser = await p.chromium.launch(headless=True)
        # Larger height to capture the full page with no cropping
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
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

        # Navigate to /bookers
        print("Navigating to /bookers ...")
        await page.goto("http://localhost:3003/bookers")
        await page.wait_for_timeout(3000)

        # Let's create a fresh booker so we can deterministically test the empty states of the 3 new charts
        print("Creating a fresh booker with ZERO entries to verify empty states...")
        await page.click("button:has-text('Add Booker')")
        await page.wait_for_timeout(1000)

        unique_id = os.urandom(3).hex()
        test_email = f"empty_chart_test_{unique_id}@gmail.com"
        await page.fill("input[placeholder='e.g. Hammad Khan']", f"Syed EmptyCharts {unique_id}")
        await page.fill("input[placeholder='e.g. hammad@gmail.com']", test_email)
        await page.fill("input[placeholder='e.g. +92 300 1234567']", "+92 301 1122334")
        await page.click("button:has-text('Save Profile')")
        await page.wait_for_timeout(3000)

        # Locate the detail link of this newly created booker
        # Since it is newly created, it will be at the top of the list or searchable.
        print("Searching for the empty-state booker...")
        await page.fill("input[placeholder='Search by name or email...']", test_email)
        await page.wait_for_timeout(1000)

        detail_locator = page.locator("a[href^='/bookers/']").first
        href = await detail_locator.get_attribute("href")
        print(f"Empty-state booker link: {href}")

        # Navigate directly to the details page of the empty-state booker
        await page.goto(f"http://localhost:3003{href}")
        await page.wait_for_timeout(4000)

        print(f"Arrived on Booker Detail Page (Empty State): {page.url}")

        # Take Empty State Screenshot (Light Mode)
        screenshot_empty = "./verification/15_empty_states_light.png"
        print(f"Capturing screenshot of Empty States Booker Detail Page: {screenshot_empty}")
        await page.screenshot(path=screenshot_empty)

        # --- NOW ADD FRESH ENTRIES DETERMINISTICALLY ---
        # Let's enter a fresh entry: Today's date with a Shortfall (Sale: 100,000, Deposit: 40,000 -> Shortfall: 60,000)
        print("Entering first daily entry (shortfall)...")
        await page.fill("input[type='number'] >> nth=0", "100000")
        await page.fill("input[type='number'] >> nth=1", "40000")
        await page.fill("textarea[placeholder*='e.g. Received']", "Initial booking order - pending collection")
        await page.click("button:has-text('Save Entry')")
        await page.wait_for_timeout(2000)

        # Let's enter a second entry for yesterday: Excess (Sale: 50,000, Deposit: 70,000 -> Excess: -20,000)
        print("Entering second daily entry (excess)...")
        today = await page.locator("input[type='date']").input_value()
        year, month, day = map(int, today.split('-'))
        import datetime
        yesterday = (datetime.date(year, month, day) - datetime.timedelta(days=1)).isoformat()
        await page.fill("input[type='date']", yesterday)
        await page.wait_for_timeout(500)
        await page.fill("input[type='number'] >> nth=0", "50000")
        await page.fill("input[type='number'] >> nth=1", "70000")
        await page.fill("textarea[placeholder*='e.g. Received']", "Cleared backlog pending balance")
        await page.click("button:has-text('Save Entry')")
        await page.wait_for_timeout(2000)

        # Let's capture the auto-prefill safeguard notice by selecting 'today' again in the date input
        print("Selecting today's date again to trigger auto-prefill safeguard notice...")
        await page.fill("input[type='date']", today)
        await page.wait_for_timeout(1000)

        screenshot_safeguard = "./verification/11_safeguard_warning_light.png"
        print(f"Capturing screenshot of safeguard pre-fill warning: {screenshot_safeguard}")
        await page.screenshot(path=screenshot_safeguard)

        # Clear/reset to make sure input warning is clean for full layout
        await page.click("button:has-text('Clear')")
        await page.wait_for_timeout(1000)

        # --- HOVER TO SHOW THE CUSTOM GLASS TOOLTIP ---
        # Let's find one of the dots in the Recharts AreaChart and hover over it
        print("Locating dot element in AreaChart to show custom frosted-glass tooltip...")
        try:
            dots = page.locator(".recharts-area-dots circle")
            first_dot = dots.first
            await first_dot.hover()
            await page.wait_for_timeout(1000)
            print("Successfully hovered over the first chart dot.")
        except Exception as err:
            print(f"Could not hover dot precisely: {err}. Attempting coordinates-based hover.")
            # Fallback to coordinate based hover over the chart container
            chart_box = await page.locator(".recharts-responsive-container").first.bounding_box()
            if chart_box:
                await page.mouse.move(chart_box["x"] + chart_box["width"] / 2, chart_box["y"] + chart_box["height"] / 2)
                await page.wait_for_timeout(1000)

        # Take Light Mode Screenshot with tooltip visible, no header crop!
        screenshot_detail_light = "./verification/12_booker_detail_light.png"
        print(f"Capturing screenshot of Booker Detail Page (Light Mode): {screenshot_detail_light}")
        await page.screenshot(path=screenshot_detail_light)

        # Toggle Dark Mode
        print("Toggling dark mode...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(1000)

        # Hover again in Dark Mode to show the dark themed frosted glass tooltip!
        try:
            dots_dark = page.locator(".recharts-area-dots circle")
            await dots_dark.first.hover()
            await page.wait_for_timeout(1000)
        except Exception:
            pass

        screenshot_detail_dark = "./verification/13_booker_detail_dark.png"
        print(f"Capturing screenshot of Booker Detail Page (Dark Mode): {screenshot_detail_dark}")
        await page.screenshot(path=screenshot_detail_dark)

        # Toggle back to light
        print("Toggling back to light mode...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(500)

        # Set mobile viewport
        print("Setting viewport to mobile size (375x2400) to capture vertical stack completely...")
        await page.set_viewport_size({"width": 375, "height": 2400})
        await page.wait_for_timeout(1000)

        screenshot_detail_mobile = "./verification/14_booker_detail_mobile.png"
        print(f"Capturing screenshot of mobile Booker Detail: {screenshot_detail_mobile}")
        await page.screenshot(path=screenshot_detail_mobile)

        print("Verification complete!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_booker_detail_flow())
