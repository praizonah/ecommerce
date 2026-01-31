#!/usr/bin/env bash
# Reads local config.env and prints KEY=VALUE lines suitable for copy-pasting
# into Railway Dashboard (Variables). Does not transmit secrets anywhere.

set -euo pipefail
CONFIG_FILE="$(dirname "$0")/../config.env"
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Error: config.env not found at $CONFIG_FILE" >&2
  exit 1
fi

# Print header
echo "# Copy the following lines into Railway Dashboard -> Variables (KEY=VALUE):"

# Read file, ignore comments and blank lines
while IFS= read -r rawline || [[ -n "$rawline" ]]; do
  line="$rawline"
  # Strip comments after #
  line="$(echo "$line" | sed 's/#.*$//')"
  # Trim whitespace
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  if [[ -z "$line" ]]; then
    continue
  fi
  if ! echo "$line" | grep -q '='; then
    continue
  fi
  key="$(echo "$line" | sed 's/[[:space:]]*=.*//')"
  val="$(echo "$line" | sed 's/^[^=]*=//; s/^[[:space:]]*//; s/[[:space:]]*$//')"
  # Remove surrounding quotes if present
  if [[ ("$val" == '"'*'"') || ("$val" == "'"*"'") ]]; then
    val="${val:1:${#val}-2}"
  fi
  echo "$key=$val"
done < "$CONFIG_FILE"
