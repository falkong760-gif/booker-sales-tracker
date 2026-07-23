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

        # --- 1. TEST MULTIPLE CONCURRENT VALIDATION ERRORS ---
        print("Clicking 'Add Booker' button to open slide-over panel...")
        await page.click("button:has-text('Add Booker')")
        await page.wait_for_timeout(1000)

        print("Entering invalid details for simultaneous validation testing...")
        await page.fill("input[placeholder='e.g. Hammad Khan']", "A") # too short
        await page.fill("input[placeholder='e.g. hammad@gmail.com']", "invalidemail") # missing @/domain
        await page.fill("input[placeholder='e.g. +92 300 1234567']", "123") # too short phone

        print("Clicking 'Save Profile' to trigger all validation errors simultaneously...")
        await page.click("button:has-text('Save Profile')")
        await page.wait_for_timeout(1000)

        # Capture validation errors list screenshot
        screenshot_validation_errors = "./verification/02_validation_error_light.png"
        print(f"Capturing screenshot of aggregate validation errors: {screenshot_validation_errors}")
        await page.screenshot(path=screenshot_validation_errors)

        # --- 2. TEST UNIQUE/DUPLICATE EMAIL SERVER ERROR STATE ---
        print("Closing the current drawer...")
        await page.click("button:has-text('Cancel')")
        await page.wait_for_timeout(500)

        # Reopen to get fresh state
        print("Opening 'Add Booker' again to test duplicate email...")
        await page.click("button:has-text('Add Booker')")
        await page.wait_for_timeout(500)

        # Use an email address that already exists in the list (we will use hammad_khan_test@gmail.com)
        print("Entering a duplicate email address...")
        await page.fill("input[placeholder='e.g. Hammad Khan']", "Duplicate Test Booker")
        await page.fill("input[placeholder='e.g. hammad@gmail.com']", "hammad_khan_test@gmail.com")
        await page.fill("input[placeholder='e.g. +92 300 1234567']", "+1 555-0199")

        print("Clicking 'Save Profile' to submit duplicate email...")
        await page.click("button:has-text('Save Profile')")
        await page.wait_for_timeout(2000)

        # Capture duplicate email error state inside the drawer
        screenshot_duplicate_error = "./verification/06_duplicate_email_error.png"
        print(f"Capturing screenshot of duplicate email error state: {screenshot_duplicate_error}")
        await page.screenshot(path=screenshot_duplicate_error)

        # --- 3. TEST SEARCH BAR FILTERING BY NAME AND EMAIL ---
        print("Closing the drawer...")
        await page.click("button:has-text('Cancel')")
        await page.wait_for_timeout(500)

        # Create a unique booker first to make sure search is predictable
        print("Opening 'Add Booker' to create a unique test booker...")
        await page.click("button:has-text('Add Booker')")
        await page.wait_for_timeout(500)
        await page.fill("input[placeholder='e.g. Hammad Khan']", "Zulqarnain FilterTest")
        await page.fill("input[placeholder='e.g. hammad@gmail.com']", "zulqarnain_test@domain.com")
        await page.fill("input[placeholder='e.g. +92 300 1234567']", "+92 321 9876543")
        await page.click("button:has-text('Save Profile')")
        await page.wait_for_timeout(2000)

        # Search by Name
        print("Filtering list by name: 'Zulqarnain' ...")
        await page.fill("input[placeholder='Search by name or email...']", "Zulqarnain")
        await page.wait_for_timeout(1000)
        screenshot_search_name = "./verification/07_search_by_name.png"
        print(f"Capturing screenshot of filter-by-name result: {screenshot_search_name}")
        await page.screenshot(path=screenshot_search_name)

        # Search by Email
        print("Filtering list by email: '@domain.com' ...")
        await page.fill("input[placeholder='Search by name or email...']", "@domain.com")
        await page.wait_for_timeout(1000)
        screenshot_search_email = "./verification/08_search_by_email.png"
        print(f"Capturing screenshot of filter-by-email result: {screenshot_search_email}")
        await page.screenshot(path=screenshot_search_email)

        # Clear search filter
        print("Clearing search filter...")
        await page.fill("input[placeholder='Search by name or email...']", "")
        await page.wait_for_timeout(1000)

        # --- 4. SUCCESS CREATION WITH NORMAL FLOW ---
        print("Creating another booker for final display representation...")
        await page.click("button:has-text('Add Booker')")
        await page.wait_for_timeout(500)
        await page.fill("input[placeholder='e.g. Hammad Khan']", "Zulqarnain Second")
        await page.fill("input[placeholder='e.g. hammad@gmail.com']", f"test_sec_{os.urandom(2).hex()}@gmail.com")
        await page.fill("input[placeholder='e.g. +92 300 1234567']", "+92 312 3456789")
        await page.click("button:has-text('Save Profile')")
        await page.wait_for_timeout(2000)

        screenshot_success = "./verification/03_creation_success_toast_light.png"
        print(f"Capturing screenshot of creation success toast and password display: {screenshot_success}")
        await page.screenshot(path=screenshot_success)

        # --- 5. DARK MODE & MOBILE CHECKS ---
        print("Toggling dark mode...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(1000)

        screenshot_dark = "./verification/04_bookers_management_dark.png"
        print(f"Capturing screenshot of bookers page in dark mode: {screenshot_dark}")
        await page.screenshot(path=screenshot_dark)

        # Toggle back to light
        print("Toggling back to light mode...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(500)

        # Set mobile viewport
        print("Setting viewport to mobile size (375x812)...")
        await page.set_viewport_size({"width": 375, "height": 812})
        await page.wait_for_timeout(1000)

        screenshot_mobile = "./verification/05_bookers_management_mobile.png"
        print(f"Capturing screenshot of mobile view: {screenshot_mobile}")
        await page.screenshot(path=screenshot_mobile)

        print("Playwright flow successfully complete!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_bookers_flow())
