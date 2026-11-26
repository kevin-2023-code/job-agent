// Public job board APIs. Each fetcher returns normalized postings:
// { id, company, title, location, url, posted, remote, salary }

const UA = { 'user-agent': 'job-agent (+https://github.com/topics/job-agent)' };

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} for ${url}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const iso = (v) => {
  if (v == null || v === '') return '';
  const d = typeof v === 'number' ? new Date(v) : new Date(String(v));
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

export const FETCHERS = {
  async greenhouse(c) {
    const j = await getJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(c.board)}/jobs`);
    return (j.jobs ?? []).map((x) => ({
      id: `gh:${c.board}:${x.id}`,
      company: c.name,
      title: (x.title ?? '').trim(),
      location: x.location?.name ?? '',
      url: x.absolute_url,
      posted: iso(x.first_published ?? x.updated_at),
      remote: /remote/i.test(x.location?.name ?? ''),
      salary: '',
    }));
  },

  async lever(c) {
    const j = await getJson(`https://api.lever.co/v0/postings/${encodeURIComponent(c.board)}?mode=json`);
    return (Array.isArray(j) ? j : []).map((x) => {
      const loc = x.categories?.allLocations?.join(' • ') || x.categories?.location || '';
      const range = x.salaryRange;
      return {
        id: `lv:${c.board}:${x.id}`,
        company: c.name,
        title: (x.text ?? '').trim(),
        location: loc,
        url: x.hostedUrl,
        posted: iso(x.createdAt),
        remote: x.workplaceType === 'remote' || /remote/i.test(loc),
        salary: range ? `${range.currency ?? ''} ${range.min ?? ''}–${range.max ?? ''}`.trim() : '',
      };
    });
  },

  async ashby(c) {
    const j = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(c.board)}?includeCompensation=true`);
    return (j.jobs ?? []).filter((x) => x.isListed !== false).map((x) => {
      const locs = [x.location, ...(x.secondaryLocations ?? []).map((s) => s.location)].filter(Boolean);
      return {
        id: `ab:${c.board}:${x.id}`,
        company: c.name,
        title: (x.title ?? '').trim(),
        location: locs.join(' • '),
        url: x.jobUrl,
        posted: iso(x.publishedAt),
        remote: Boolean(x.isRemote) || x.workplaceType === 'Remote',
        salary: x.compensation?.scrapeableCompensationSalarySummary ?? '',
      };
    });
  },

  async smartrecruiters(c) {
    const out = [];
    for (let offset = 0; offset < 1000; offset += 100) {
      const j = await getJson(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(c.board)}/postings?limit=100&offset=${offset}`);
      for (const x of j.content ?? []) {
        const l = x.location ?? {};
        const loc = [l.city, l.region, l.country].filter(Boolean).join(', ') + (l.remote ? ' (Remote)' : '');
        out.push({
          id: `sr:${c.board}:${x.id}`,
          company: c.name,
          title: (x.name ?? '').trim(),
          location: loc,
          url: `https://jobs.smartrecruiters.com/${c.board}/${x.id}`,
          posted: iso(x.releasedDate),
          remote: Boolean(l.remote),
          salary: '',
        });
      }
      if (!j.content || j.content.length < 100) break;
    }
    return out;
  },
};

export function matchesFilters(job, filters = {}, now = new Date()) {
  const title = job.title.toLowerCase();
  const inc = (filters.title_include ?? []).map((s) => String(s).toLowerCase());
  const exc = (filters.title_exclude ?? []).map((s) => String(s).toLowerCase());
  if (inc.length && !inc.some((k) => title.includes(k))) return false;
  if (exc.some((k) => hasWord(title, k))) return false;

  const locs = (filters.locations ?? []).map((s) => String(s).toLowerCase());
  if (locs.length) {
    const where = `${job.location} ${job.remote ? 'remote' : ''}`.toLowerCase();
    if (!locs.some((k) => where.includes(k))) return false;
  }

  const maxAge = Number(filters.max_age_days ?? 0);
  if (maxAge > 0 && job.posted) {
    const ageDays = (now - new Date(job.posted)) / 86_400_000;
    if (ageDays > maxAge) return false;
  }
  return true;
}

// Excludes match on word boundaries, so "intern" doesn't drop "internal tools".
function hasWord(text, word) {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`).test(text);
}
