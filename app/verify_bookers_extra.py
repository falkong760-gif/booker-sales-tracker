import sys
import os
import asyncio
import random
from playwright.async_api import async_playwright

async def run_extra_verifications():
    print("Launching Playwright for extended verifications...")
    async with async_playwright() as p:
        # Launch browser headlessly
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # Listen to console logs
        page.on("console", lambda msg: print(f"[BROWSER] {msg.type}: {msg.text}"))

        # Step 1: Login
        print("Navigating to http://localhost:3003/login ...")
        await page.goto("http://localhost:3003/login")

        # Wait longer to ensure full hydration and compilation
        print("Waiting 5 seconds for Next.js compilation and hydration...")
        await page.wait_for_timeout(5000)

        # Wait for the input to become enabled
        print("Waiting for #email to be enabled...")
        await page.wait_for_selector("#email:not([disabled])", timeout=15000)

        # Fill credentials
        print("Logging in...")
        await page.fill("#email", "booker@gmail.com")
        await page.fill("#password", "booker@@")
        await page.click("button[type='submit']")
        await page.wait_for_url("**/dashboard", timeout=15000)

        # Step 2: Go to /bookers
        print("Navigating to /bookers ...")
        await page.goto("http://localhost:3003/bookers")
        await page.wait_for_timeout(3000)

        # Requirement 1 & 2a: Screenshot of the slide-over panel itself (open state, showing Name/Phone/Email fields filled)
        print("Opening 'Add Booker' Drawer...")
        await page.click("button:has-text('Add Booker')")
        await page.wait_for_timeout(1000)

        # Fill fields with sample data
        print("Filling out drawer form...")
        await page.fill("input[placeholder='e.g. Hammad Khan']", "Hammad Khan")
        await page.fill("input[placeholder='e.g. hammad@gmail.com']", "invalid-email-format")
        await page.fill("input[placeholder='e.g. +92 300 1234567']", "123") # short/invalid phone
        await page.wait_for_timeout(1000)

        # Screenshot 1: Drawer open state filled
        os.makedirs("/home/jules/verification", exist_ok=True)
        await page.screenshot(path="/home/jules/verification/bookers_add_drawer_filled.png")
        print("Captured: bookers_add_drawer_filled.png")

        # Requirement 2b: Screenshot of validation error state
        print("Triggering validation error (Invalid Email)...")
        await page.click("button:has-text('Save Profile')")
        await page.wait_for_timeout(1000)

        # Screenshot 2: Validation Error
        await page.screenshot(path="/home/jules/verification/bookers_validation_error.png")
        print("Captured: bookers_validation_error.png")

        # Correct fields to test success creation toast
        print("Correcting fields to create valid booker...")
        rand_num = random.randint(1000, 9999)
        test_email = f"hammad_khan_{rand_num}@gmail.com"
        await page.fill("input[placeholder='e.g. hammad@gmail.com']", test_email)
        await page.fill("input[placeholder='e.g. +92 300 1234567']", "+92 300 1234567")
        await page.wait_for_timeout(1000)

        # Submit valid profile
        print("Submitting valid profile...")
        await page.click("button:has-text('Save Profile')")
        await page.wait_for_timeout(4000)

        # Screenshot 3: Success creation toast with correct text
        await page.screenshot(path="/home/jules/verification/bookers_success_creation.png")
        print("Captured: bookers_success_creation.png")

        # Requirement 3: Dark Mode version of Bookers page
        print("Toggling Dark Mode...")
        # Let's locate the theme toggle button in the top bar. In desktop sidebar/topbar layout, we have a theme switcher.
        # Let's search for any button containing svg.lucide-moon or lucide-sun
        moon_btn = page.locator("button:has(svg.lucide-moon), button:has(svg.lucide-sun)").first
        if await moon_btn.count() > 0:
            await moon_btn.click()
            await page.wait_for_timeout(1500)
            print("Dark Mode toggled via header button.")
        else:
            print("Theme button not direct, trying to click theme toggle element...")
            await page.evaluate("() => { const btn = document.querySelector('button svg.lucide-moon')?.parentElement || document.querySelector('button svg.lucide-sun')?.parentElement; if (btn) btn.click(); }")
            await page.wait_for_timeout(1500)

        await page.screenshot(path="/home/jules/verification/bookers_dark_mode.png")
        print("Captured: bookers_dark_mode.png")

        # Switch back to Light Mode
        print("Switching back to Light Mode...")
        await page.evaluate("() => { const btn = document.querySelector('button svg.lucide-sun')?.parentElement; if (btn) btn.click(); }")
        await page.wait_for_timeout(1000)

        # Requirement 5: Confirm Search actually filters by both name AND email
        # Test 1: Search by Name
        print("Testing search by name 'Hammad'...")
        await page.fill("input[placeholder='Search by name or email...']", "Hammad")
        await page.wait_for_timeout(1500)
        await page.screenshot(path="/home/jules/verification/bookers_search_by_name.png")
        print("Captured: bookers_search_by_name.png")

        # Test 2: Search by Email
        print(f"Testing search by email '{test_email}'...")
        await page.fill("input[placeholder='Search by name or email...']", test_email)
        await page.wait_for_timeout(1500)
        await page.screenshot(path="/home/jules/verification/bookers_search_by_email.png")
        print("Captured: bookers_search_by_email.png")

        # Clear search
        await page.fill("input[placeholder='Search by name or email...']", "")
        await page.wait_for_timeout(1000)

        # Requirement 4: Mobile viewport version
        print("Setting mobile viewport size (375x812)...")
        await page.set_viewport_size({"width": 375, "height": 812})
        await page.wait_for_timeout(2000)

        # Screenshot 4: Mobile Stacked Viewport
        await page.screenshot(path="/home/jules/verification/bookers_mobile_view.png")
        print("Captured: bookers_mobile_view.png")

        print("All extra verifications complete successfully!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_extra_verifications())
