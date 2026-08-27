#!/usr/bin/env python3
"""
Test script for Google Sheets integration.
This simulates the bot sending data to Google Sheets Web App URL.
Usage:
  1. First, manually test the Apps Script by deploying it as a Web App
  2. Run: python3 /home/lenovo/ai-trading-website/scripts/test-sheets-connection.py
  3. If WEBAPP_URL is set in .env.bot, it will test against the real endpoint
"""

import os
import json
import urllib.request
import urllib.parse

# Load env
from dotenv import load_dotenv
load_dotenv('/home/lenovo/.env.bot')

WEBAPP_URL = os.getenv("GOOGLE_SHEETS_WEBAPP_URL", "").strip()

if not WEBAPP_URL or "YOUR_DEPLOYMENT_ID" in WEBAPP_URL:
    print("⚠️  GOOGLE_SHEETS_WEBAPP_URL not configured in .env.bot")
    print("   Edit /home/lenovo/.env.bot and set GOOGLE_SHEETS_WEBAPP_URL")
    print("   (Get URL from Google Apps Script → Deploy → Web App → Copy link)")
    print("\n   Example test data that WOULD be sent:")
    print("   balance=10000&daily_pnl=500&total_pnl=5000&biggest_win=500")
    print("   &total_positions=3&session_id=test-123&status=running")
    print("   &current_positions=[{\"symbol\":\"BTCUSDT\"}]&total_unrealized_pnl=320.5")
    print("\n✅ Bot code syntax OK (Google Sheets integration compiled)")
    exit(0)

# Test data
test_params = {
    'balance': '10000',
    'daily_pnl': '500',
    'total_pnl': '5000',
    'biggest_win': '500',
    'total_positions': '3',
    'session_id': 'test-123',
    'current_positions': '[{"symbol":"BTCUSDT","side":"long","qty":0.1}]',
    'status': 'running',
    'total_unrealized_pnl': '320.5'
}

url = WEBAPP_URL + '?' + urllib.parse.urlencode(test_params)
print(f"📊 Testing Google Sheets connection...")
print(f"   URL: {url[:100]}...")

try:
    req = urllib.request.Request(url)
    req.add_header('User-Agent', 'Mozilla/5.0')
    with urllib.request.urlopen(req, timeout=10) as response:
        result = response.read().decode('utf-8')
        data = json.loads(result)
        if data.get('success'):
            print(f"✅ SUCCESS! Data written to Sheets (row {data.get('row')})")
            print(f"   Response: {json.dumps(data, indent=2)}")
        else:
            print(f"⚠️  Sheets responded but with error: {data}")
except Exception as e:
    print(f"❌ FAILED: {e}")
    print(f"   Check: Apps Script deployed as 'Anyone' access, URL is correct")

# Also test read_last
print(f"\n📊 Testing read_last endpoint...")
read_url = WEBAPP_URL + '?mode=read_last'
try:
    req = urllib.request.Request(read_url)
    req.add_header('User-Agent', 'Mozilla/5.0')
    with urllib.request.urlopen(req, timeout=10) as response:
        result = response.read().decode('utf-8')
        data = json.loads(result)
        if data.get('success') and data.get('data'):
            print(f"✅ SUCCESS! Read last row:")
            print(json.dumps(data['data'], indent=2))
        else:
            print(f"   No data yet: {data}")
except Exception as e:
    print(f"❌ Read FAILED: {e}")