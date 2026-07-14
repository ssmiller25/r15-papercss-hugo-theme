# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

#!/usr/bin/env python3
"""
Generate commits data JSON file for Hugo site.
Extracts git commits and formats them for use in the home page template.

This script is designed to work with the r15-papercss-hugo-theme when
it displays git commits on the home page instead of blog posts.

Run with uv:
    uv run scripts/generate-commits-data.py

Configuration (in Hugo config.yaml):
    params:
      github_repo: "username/repo-name"  # For commit links

The script will:
1. Extract git commits (optionally filtered to content/ directory)
2. Generate data/commits.json with commit details
3. Map changed files to site URLs for linking
4. Apply any display-override git notes (see NOTES_REF below) in place of
   the real commit subject/body, without touching git history

Display overrides via git notes:
    A commit's displayed heading/body can be corrected after the fact by
    attaching a note under NOTES_REF, instead of rewriting history:

        git notes --ref=refs/notes/site-display add -m "New heading

        New body text." <commit-hash>
        git push origin refs/notes/site-display

    Notes aren't fetched by a normal `git fetch`/clone, so pull them
    explicitly before generating data:

        git fetch origin refs/notes/site-display:refs/notes/site-display

    A commit with no note uses its real subject/body, unchanged.

Based on: https://github.com/ssmiller25/r15cookie-site
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Notes ref used for display-override annotations. Kept separate from the
# default refs/notes/commits so this concern doesn't collide with any other
# use of git notes.
NOTES_REF = "refs/notes/site-display"

STATUS_MAP = {
    "A": {"label": "Added", "icon": "➕"},
    "D": {"label": "Deleted", "icon": "❌"},
    "M": {"label": "Modified", "icon": "✏️"},
    "R": {"label": "Renamed", "icon": "🔄"},
    "C": {"label": "Copied", "icon": "📋"}
}

def run_git_command(args: list[str], cwd: Path = None) -> str:
    """Run a git command and return stdout."""
    try:
        result = subprocess.run(
            ["git"] + args,
            capture_output=True,
            text=True,
            errors="replace",
            check=True,
            cwd=cwd
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running git command: git {' '.join(args)}", file=sys.stderr)
        print(f"Working directory: {cwd or Path.cwd()}", file=sys.stderr)
        print(f"Return code: {e.returncode}", file=sys.stderr)
        if e.stderr:
            print(f"Git error: {e.stderr}", file=sys.stderr)
        sys.exit(1)

def get_note_overrides(notes_ref: str = NOTES_REF) -> dict[str, tuple[str, str]]:
    """Read display-override notes: commit_hash -> (heading, body).

    Notes are attached with `git notes --ref={notes_ref} add ...` and let a
    commit's displayed subject/body be corrected without rewriting the
    commit itself. If a commit has no note, its real subject/body is used.
    """
    # Check the ref exists first rather than relying on `git notes list`'s
    # exit behavior for a missing ref, which isn't consistent across git
    # versions/platforms — this way a fresh clone/CI checkout with no notes
    # yet never risks a hard failure here.
    ref_exists = subprocess.run(
        ["git", "rev-parse", "--verify", "--quiet", notes_ref],
        capture_output=True
    ).returncode == 0
    if not ref_exists:
        return {}

    list_output = run_git_command(["notes", f"--ref={notes_ref}", "list"])

    overrides = {}
    for line in list_output.split("\n"):
        if not line.strip():
            continue
        parts = line.split()
        if len(parts) != 2:
            continue
        note_blob_sha, commit_sha = parts
        note_text = run_git_command(["show", note_blob_sha])
        note_lines = note_text.split("\n")
        heading = note_lines[0].strip()
        body = "\n".join(note_lines[1:]).strip()
        overrides[commit_sha] = (heading, body)

    return overrides

def get_commits(limit: int = 100, content_only: bool = True, note_overrides: dict | None = None) -> list[dict]:
    """Get recent commits with their details."""
    note_overrides = note_overrides or {}
    format_str = "%H%n%h%n%an%n%ae%n%ai%n%s%n%b%n---COMMIT_SEPARATOR---%n"
    
    # Filter to only commits that touch content/ directory
    git_args = ["log", f"-{limit}", f"--format={format_str}"]
    if content_only:
        git_args.append("--")  # Separator for paths
        git_args.append("content/")  # Only commits touching content/
    
    log_output = run_git_command(git_args)
    
    commits = []
    commit_blocks = log_output.split("---COMMIT_SEPARATOR---")
    
    for block in commit_blocks:
        if not block.strip():
            continue
            
        lines = block.strip().split("\n")
        if len(lines) < 6:
            continue
            
        full_hash = lines[0]
        short_hash = lines[1]
        author_name = lines[2]
        author_email = lines[3]
        author_date = lines[4]
        subject = lines[5]
        body = "\n".join(lines[6:]).strip() if len(lines) > 6 else ""

        # A display-override note fully replaces both heading and body for
        # this commit; the underlying commit itself is untouched.
        if full_hash in note_overrides:
            subject, body = note_overrides[full_hash]

        # Get changed files for this commit
        # -M enables rename detection so renames arrive as a single "Rxxx\told\tnew"
        # line instead of being split into a separate Delete + Add.
        changed_files_output = run_git_command([
            "diff-tree",
            "--no-commit-id",
            "--name-status",
            "-M",
            "-r",
            full_hash
        ])

        # Parse name-status output: lines like "M\tfile.md", "A\tfile.md", or
        # "R091\told/path.md\tnew/path.md" for detected renames/copies.
        changed_files = []
        for line in changed_files_output.split("\n"):
            if not line.strip():
                continue
            parts = line.split("\t")
            if len(parts) >= 2:
                status = parts[0].strip()[0]  # drop the similarity % suffix, e.g. "R091" -> "R"
                file_path = parts[2].strip() if status in ("R", "C") and len(parts) >= 3 else parts[1].strip()
                changed_files.append({
                    "path": file_path,
                    "status": status  # A=Added, D=Deleted, M=Modified, R=Renamed, C=Copied
                })
        
        # Only include commits that actually touch content/
        if content_only:
            content_files = [f for f in changed_files if f["path"].startswith("content/")]
            if not content_files:
                continue  # Skip this commit
            changed_files = content_files  # Only show content files
        
        # Parse date
        try:
            date_obj = datetime.fromisoformat(author_date)
            formatted_date = date_obj.strftime("%B %d, %Y")
            iso_date = date_obj.isoformat()
        except:
            formatted_date = author_date
            iso_date = author_date
        
        commits.append({
            "full_hash": full_hash,
            "short_hash": short_hash,
            "author_name": author_name,
            "author_email": author_email,
            "date": formatted_date,
            "iso_date": iso_date,
            "subject": subject,
            "body": body,
            "changed_files": changed_files
        })
    
    return commits

def map_file_to_site_url(file_path: str, base_url: str = "") -> dict | None:
    """Map a git file path to a site URL."""
    path = Path(file_path)
    
    if path.parts[0] == "content":
        relative = str(path.relative_to("content"))
        
        if path.name == "_index.md":
            section = str(path.parent.relative_to("content"))
            url = f"/{section}/" if section else "/"
            return {"url": url, "type": "section"}
        
        if path.suffix in [".md", ".html"]:
            name = path.stem
            if name == "_index":
                name = ""
            
            dir_parts = list(path.parent.parts[1:])
            if name:
                dir_parts.append(name)
            
            url = "/" + "/".join(dir_parts) + "/"
            return {"url": url, "type": "page"}
    
    # For non-content files, link to GitHub
    github_repo = base_url.replace("https://github.com/", "").rstrip("/")
    return {
        "url": f"https://github.com/{github_repo}/blob/main/{file_path}",
        "type": "github"
    }

def main():
    """Generate commits data JSON file."""
    # Get the repo root directory
    repo_root = Path(__file__).parent.parent
    
    # Change to repo root directory
    import os
    os.chdir(repo_root)
    
    # Verify we're in a git repo
    try:
        run_git_command(["rev-parse", "--git-dir"])
    except SystemExit:
        print("ERROR: Not a git repository!", file=sys.stderr)
        sys.exit(1)
    
    data_dir = repo_root / "data"
    output_file = data_dir / "commits.json"
    
    data_dir.mkdir(exist_ok=True)
    
    # Get commits (filtered to content/ by default), applying any
    # display-override notes on top of the real commit messages
    note_overrides = get_note_overrides()
    commits = get_commits(limit=100, content_only=True, note_overrides=note_overrides)
    
    # Get GitHub repo from config (if available)
    github_repo = ""
    config_file = repo_root / "config.yaml"
    if config_file.exists():
        with open(config_file, "r") as f:
            for line in f:
                if "github_repo:" in line:
                    github_repo = line.split(":", 1)[1].strip().strip('"').strip("'")
                    break
    
    # Process commits and map file paths to URLs
    for commit in commits:
        mapped_files = []
        for file_info in commit["changed_files"]:
            file_path = file_info["path"]
            status = file_info["status"]
            mapped = map_file_to_site_url(file_path, github_repo)
            if mapped:
                mapped["file_path"] = file_path
                mapped["status"] = status
                mapped["status_info"] = STATUS_MAP.get(status, {"label": status, "icon": "📄"})
                mapped_files.append(mapped)
        
        commit["changed_files_mapped"] = mapped_files
    
    # Write JSON output
    with open(output_file, "w") as f:
        json.dump(commits, f, indent=2)
    
    print(f"Generated {len(commits)} commits data at {output_file}")
    applied_overrides = sum(1 for c in commits if c["full_hash"] in note_overrides)
    if applied_overrides:
        print(f"Applied {applied_overrides} display-override note(s) from {NOTES_REF}")
    if len(commits) == 0:
        print("NOTE: No commits found that touch content/ directory.")
        print("To include all commits, edit this script and set content_only=False")

if __name__ == "__main__":
    main()
