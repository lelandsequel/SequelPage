#!/bin/bash
curl -X POST "https://ebdwtjdizsdfanjaihnz.supabase.co/functions/v1/create-test-users" \
  -H "Content-Type: application/json" \
  -d '{"email": "leland@candlstrategy.com", "password": "GoBrowns333", "fullName": "Leland", "role": "super_admin"}'
