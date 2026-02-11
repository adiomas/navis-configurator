#!/bin/bash
# Build: combines all parts into a single index.html
cd "$(dirname "$0")"
cat parts/01-head.html \
    parts/02-login.html \
    parts/03-app-start.html \
    parts/04-dashboard.html \
    parts/05-boats.html \
    parts/06-boat-new.html \
    parts/07-boat-detail.html \
    parts/08-equipment.html \
    parts/09-import.html \
    parts/10-config-1.html \
    parts/11-config-2.html \
    parts/12-config-3.html \
    parts/13-config-4.html \
    parts/14-quotes.html \
    parts/15-quote-detail.html \
    parts/16-settings.html \
    parts/17-app-end.html \
    parts/18-modals.html \
    parts/19-scripts.html \
    > index.html

echo "Built index.html ($(wc -l < index.html) lines, $(du -h index.html | cut -f1))"
