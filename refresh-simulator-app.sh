#!/bin/bash
#
# # Uninstall the app from simulator (this removes all app data)
xcrun simctl uninstall booted ai.prometheusags.theboss

# Or reset the simulator entirely
xcrun simctl erase all

# Then run again
yarn ios
