###
# #%L
# com.mobi.mobi-distribution
# $Id:$
# $HeadURL:$
# %%
# Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
# %%
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
# #L%
###

#!/bin/bash

# Set variables
VERSION_FILE="/opt/mobi/mobi-distribution/etc/mobi.version"
ETC_DIR="/opt/mobi/mobi-distribution/etc"
DATA_DIR="/opt/mobi/mobi-distribution/data"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ -z "$(ls -A /opt/mobi/mobi-distribution/etc)" ]; then
   cp -r /opt/mobi/mobi-etc-defaults/* /opt/mobi/mobi-distribution/etc/
fi

# Check if MOBI_VERSION is set
if [[ -z "$MOBI_VERSION" ]]; then
  echo "Error: MOBI_VERSION environment variable is not set."
  exit 1
fi

# Check if the version file exists
if [[ ! -f "$VERSION_FILE" ]]; then
  echo "Version file does not exist. Creating it with MOBI_VERSION: $MOBI_VERSION"
  echo "$MOBI_VERSION" > "$VERSION_FILE"
fi

# Read the version from the file
CURRENT_VERSION=$(cat "$VERSION_FILE")

# Compare versions
if [[ "$CURRENT_VERSION" == "$MOBI_VERSION" ]]; then
  echo "MOBI_VERSION $MOBI_VERSION matches the version file $CURRENT_VERSION. Continuing..."
else
  echo "MOBI_VERSION mismatch."
  echo "Current: $CURRENT_VERSION, New: $MOBI_VERSION"

  # Create unique zip files
  ZIP_ETC="etc_backup_${CURRENT_VERSION}_${TIMESTAMP}.zip"
  ZIP_DATA="data_backup_${CURRENT_VERSION}_${TIMESTAMP}.zip"

  echo "Zipping $ETC_DIR to $ZIP_ETC..."
  (cd "$ETC_DIR" && zip -rq "$ZIP_ETC" . -x "*.zip")

  echo "Zipping $DATA_DIR to $ZIP_DATA..."
  (cd "$DATA_DIR" && zip -rq "$ZIP_DATA" . -x "*.zip")

  echo "Backups created: $ZIP_ETC, $ZIP_DATA"

  echo "Deleting contents of $ETC_DIR and $DATA_DIR (excluding .zip files)..."
    find "$ETC_DIR" -mindepth 1 ! -name '*.zip' -exec rm -rf {} + 2>/dev/null
    find "$DATA_DIR" -mindepth 1 ! -name '*.zip' -exec rm -rf {} + 2>/dev/null
    echo "Deletion complete."

  # Copy default configuration files
  echo "Copying default configuration files from /opt/mobi/mobi-etc-defaults to $ETC_DIR..."
  cp -r /opt/mobi/mobi-etc-defaults/* /opt/mobi/mobi-distribution/etc/

  # Update the version file
  echo "Updating version file with new MOBI_VERSION: $MOBI_VERSION"
  echo "$MOBI_VERSION" > "$VERSION_FILE"
fi
echo "Running Karaf Server..."
/opt/mobi/mobi-distribution/bin/karaf run
