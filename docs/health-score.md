# Repository Health Score

Open Source Buddy computes a **Health Score (0 – 100)** for each repository to help first-time contributors find welcoming, actively maintained projects where their pull requests are likely to be reviewed promptly.

---

## Point Breakdown

The score consists of four weighted components:

| Component | Max Points | Description |
|---|---|---|
| **Recency** | 30 pts | Measures how recently a pull request was merged |
| **Responsiveness** | 25 pts | Average maintainer response time on new issues/PRs |
| **CONTRIBUTING guide** | 20 pts | Presence of a clear `CONTRIBUTING.md` file |
| **Recent Activity** | 25 pts | Number of merged pull requests in the last 30 days |
| **Total** | **100 pts** | Clamped to range `[0, 100]` |

---

### 1. Recency of Merged PRs (0 – 30 points)
- `lastMergedPrDays <= 7`: **30 pts** (active within the last week)
- `lastMergedPrDays <= 30`: **20 pts** (active within the last month)
- `lastMergedPrDays <= 90`: **10 pts** (active within the last quarter)
- `lastMergedPrDays > 90` or null: **0 pts**

### 2. Responsiveness (0 – 25 points)
- `responseHours <= 24`: **25 pts** (responses within 1 day)
- `responseHours <= 72`: **15 pts** (responses within 3 days)
- `responseHours <= 168`: **5 pts** (responses within 1 week)
- `responseHours > 168` or null: **0 pts**

### 3. CONTRIBUTING Guide (0 or 20 points)
- `hasContributing === true`: **20 pts**
- `hasContributing === false`: **0 pts**

### 4. Recent PR Activity (0 – 25 points)
- Scaled linearly based on merged PR count in the last 30 days:
  `pts = Math.min(25, mergedPrs30d * 2.5)`
- 10+ merged PRs yields the maximum of **25 pts**.

---

## Example Calculation

A repository with:
- Last PR merged 3 days ago (`lastMergedPrDays = 3`): **30 pts**
- Average response time 18 hours (`responseHours = 18`): **25 pts**
- Has `CONTRIBUTING.md` (`hasContributing = true`): **20 pts**
- 6 PRs merged in the last 30 days: `6 * 2.5` = **15 pts**

**Total Score = 30 + 25 + 20 + 15 = 90 / 100 (Excellent)**

---

## Rating Thresholds

- 🟢 **75 – 100 (Great)**: Highly active, beginner-friendly repo.
- 🟡 **50 – 74 (Fair)**: Moderately active; responses may take a few days.
- 🔴 **0 – 49 (Caution)**: Inactive or slow maintainers; higher chance of unreviewed PRs.
