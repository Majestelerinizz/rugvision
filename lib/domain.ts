// Kullanici girdisinden temiz bir host cikarir (protokol/path/www temizler).
export function normalizeHost(input: string): string {
  let host = input.trim().toLowerCase();
  host = host.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  host = host.replace(/^www\./, "");
  return host;
}

// SSRF korumasi: localhost / ozel-ic ag / IP literal hedeflerini reddet.
export function isPublicHost(host: string): boolean {
  if (!host || !host.includes(".")) return false;
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (host.endsWith(".local") || host.endsWith(".internal")) return false;

  // Ham IPv4 literali ve ozel araliklar.
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 0) return false;
    if (a === 169 && b === 254) return false; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    return true;
  }

  // IPv6 literal / loopback.
  if (host.includes(":")) return false;
  return true;
}
