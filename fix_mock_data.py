#!/usr/bin/env python3
"""
Fix DAKKHO Student App compiled JS by replacing all mock/hardcoded data
with empty arrays or API-driven values.
"""

import sys
import os

FILE_PATH = '/home/z/my-project/student-app/out/_next/static/chunks/3c0m6n8889s2x.js'

def find_array_end(content, start_pos):
    """Find the matching ] for the [ at start_pos, respecting strings and nested brackets."""
    depth = 0
    i = start_pos
    while i < len(content):
        c = content[i]
        # Skip string literals
        if c == '"':
            i += 1
            while i < len(content) and content[i] != '"':
                if content[i] == '\\':
                    i += 1  # skip escaped char
                i += 1
            i += 1  # skip closing quote
            continue
        if c == "'":
            i += 1
            while i < len(content) and content[i] != "'":
                if content[i] == '\\':
                    i += 1
                i += 1
            i += 1
            continue
        # Skip template literals (backticks) - simplified
        if c == '`':
            i += 1
            while i < len(content) and content[i] != '`':
                if content[i] == '\\':
                    i += 1
                i += 1
            i += 1
            continue
        if c == '[':
            depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1

def replace_array_var(content, var_name, search_prefix=None):
    """Find a variable array assignment and replace it with VAR_NAME=[]"""
    if search_prefix:
        pattern = search_prefix
    else:
        pattern = var_name + '=['
    
    idx = content.find(pattern)
    if idx == -1:
        print(f"  WARNING: Pattern '{pattern[:50]}' not found!")
        return content, False
    
    # Find the opening bracket
    bracket_pos = idx + len(pattern) - 1  # position of '['
    end = find_array_end(content, bracket_pos)
    if end == -1:
        print(f"  WARNING: Could not find end of array for '{pattern[:50]}'!")
        return content, False
    
    old = content[idx:end+1]
    var_prefix = pattern[:-1]  # everything before '['
    new = var_prefix + '[]'
    
    print(f"  Replacing {var_name} array (length {len(old)} -> {len(new)})")
    print(f"    Old starts: {old[:80]}...")
    print(f"    Old ends: ...{old[-40:]}")
    
    content = content[:idx] + new + content[end+1:]
    return content, True

def main():
    print(f"Reading file: {FILE_PATH}")
    with open(FILE_PATH, 'r') as f:
        content = f.read()
    
    original_size = len(content)
    print(f"File size: {original_size} bytes")
    print()
    
    changes_made = 0
    
    # ============================================================
    # 1. Mock Leaderboard Data (Home Page Mini-Leaderboard) - dQ
    # ============================================================
    print("1. Replacing dQ (Home Mini-Leaderboard)...")
    content, ok = replace_array_var(content, 'dQ')
    if ok: changes_made += 1
    print()
    
    # ============================================================
    # 2. Full Leaderboard Page - local i array (Ayesha Khan)
    # ============================================================
    print("2. Replacing full leaderboard i=[...] (Ayesha Khan)...")
    content, ok = replace_array_var(content, 'i (leaderboard)', 
                                     search_prefix='i=[{rank:1,name:"Ayesha Khan"')
    if ok: changes_made += 1
    print()
    
    # ============================================================
    # 3. Achievement Data - fM
    # ============================================================
    print("3. Replacing fM (Achievements)...")
    content, ok = replace_array_var(content, 'fM')
    if ok: changes_made += 1
    print()
    
    # ============================================================
    # 4. Profile Stats - hardcoded values
    # ============================================================
    print("4. Replacing Profile Stats values...")
    profile_stats = [
        ('label:"Courses Enrolled",value:12', 'label:"Courses Enrolled",value:0'),
        ('label:"Hours Watched",value:48', 'label:"Hours Watched",value:0'),
        ('label:"Certificates",value:5', 'label:"Certificates",value:0'),
        ('label:"Current Streak",value:14', 'label:"Current Streak",value:0'),
    ]
    for old, new in profile_stats:
        if old in content:
            content = content.replace(old, new, 1)
            print(f"  Replaced: {old} -> {new}")
            changes_made += 1
        else:
            print(f"  WARNING: Not found: {old}")
    print()
    
    # ============================================================
    # 5. Streak Calendar - fc
    # ============================================================
    print("5. Replacing fc (Streak Calendar)...")
    content, ok = replace_array_var(content, 'fc')
    if ok: changes_made += 1
    print()
    
    # ============================================================
    # 6. Home Page Streak Stats - dP (replace values with 0)
    # ============================================================
    print("6. Replacing dP values with 0...")
    # dP has: Hours Watched:12, Videos Completed:24, Day Streak:7, XP Earned:850
    # But dP is now already found. Let me do targeted replacements within dP
    dp_replacements = [
        ('label:"Hours Watched",value:12,icon:n6', 'label:"Hours Watched",value:0,icon:n6'),
        ('label:"Videos Completed",value:24,icon:da', 'label:"Videos Completed",value:0,icon:da'),
        ('label:"Day Streak",value:7,icon:dr', 'label:"Day Streak",value:0,icon:dr'),
        ('label:"XP Earned",value:850,icon:lr', 'label:"XP Earned",value:0,icon:lr'),
    ]
    for old, new in dp_replacements:
        if old in content:
            content = content.replace(old, new, 1)
            print(f"  Replaced: {old} -> {new}")
            changes_made += 1
        else:
            print(f"  WARNING: Not found: {old}")
    print()
    
    # ============================================================
    # 7. Certificates - hR
    # ============================================================
    print("7. Replacing hR (Certificates)...")
    content, ok = replace_array_var(content, 'hR')
    if ok: changes_made += 1
    print()
    
    # ============================================================
    # 8. Discussion Threads - h5
    # ============================================================
    print("8. Replacing h5 (Discussion Threads)...")
    content, ok = replace_array_var(content, 'h5')
    if ok: changes_made += 1
    print()
    
    # ============================================================
    # 9. Course Reviews - pU
    # ============================================================
    print("9. Replacing pU (Course Reviews)...")
    content, ok = replace_array_var(content, 'pU')
    if ok: changes_made += 1
    print()
    
    # ============================================================
    # 10. Q&A Data - xX
    # ============================================================
    print("10. Replacing xX (Q&A Data)...")
    content, ok = replace_array_var(content, 'xX')
    if ok: changes_made += 1
    print()
    
    # ============================================================
    # 11. Announcements - pX
    # ============================================================
    print("11. Replacing pX (Announcements)...")
    content, ok = replace_array_var(content, 'pX')
    if ok: changes_made += 1
    print()
    
    # ============================================================
    # 12. Fix CSE default in profile / leaderboard filter
    # ============================================================
    print("12. Fixing CSE defaults...")
    
    # Replace useState("CSE") with useState("") in study group form
    old_cse = ',p]=(0,J.useState)("CSE")'
    new_cse = ',p]=(0,J.useState)("")'
    if old_cse in content:
        content = content.replace(old_cse, new_cse, 1)
        print(f"  Replaced: {old_cse} -> {new_cse}")
        changes_made += 1
    else:
        print(f"  WARNING: Not found: {old_cse}")
    
    # Replace leaderboard dept filter
    old_filter = '["All","CSE","EEE","ME","CE","ETE","Architecture","Chemical"]'
    new_filter = '["All"]'
    if old_filter in content:
        content = content.replace(old_filter, new_filter, 1)
        print(f"  Replaced dept filter with ['All']")
        changes_made += 1
    else:
        print(f"  WARNING: Not found: dept filter")
    print()
    
    # ============================================================
    # 13. Streak value "5" in exam results (Day Streak value:5)
    # ============================================================
    print("13. Replacing Day Streak value:5...")
    old_streak5 = 'label:"Day Streak",value:5'
    new_streak5 = 'label:"Day Streak",value:0'
    if old_streak5 in content:
        content = content.replace(old_streak5, new_streak5, 1)
        print(f"  Replaced: {old_streak5} -> {new_streak5}")
        changes_made += 1
    else:
        print(f"  WARNING: Not found: {old_streak5}")
    
    # Also replace Day Streak value:14 (second occurrence, exam results context)
    old_streak14 = 'label:"Day Streak",value:14'
    new_streak14 = 'label:"Day Streak",value:0'
    if old_streak14 in content:
        content = content.replace(old_streak14, new_streak14, 1)
        print(f"  Replaced: {old_streak14} -> {new_streak14}")
        changes_made += 1
    else:
        print(f"  INFO: Not found (may already be replaced): {old_streak14}")
    print()
    
    # ============================================================
    # 14. Daily Goals - dA
    # ============================================================
    print("14. Replacing dA (Daily Goals)...")
    content, ok = replace_array_var(content, 'dA')
    if ok: changes_made += 1
    print()
    
    # ============================================================
    # 15. Course Progress mock data - dC
    # ============================================================
    print("15. Replacing dC (Course Progress)...")
    content, ok = replace_array_var(content, 'dC')
    if ok: changes_made += 1
    print()
    
    # ============================================================
    # Write back
    # ============================================================
    new_size = len(content)
    print(f"\n{'='*60}")
    print(f"Summary: {changes_made} changes made")
    print(f"File size: {original_size} -> {new_size} (saved {original_size - new_size} bytes)")
    print(f"{'='*60}")
    
    with open(FILE_PATH, 'w') as f:
        f.write(content)
    
    print(f"\nFile written successfully!")

if __name__ == '__main__':
    main()
