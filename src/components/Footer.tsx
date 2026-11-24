export function Footer() {
  return (
    <footer className="bg-white py-12">
      <div className="mx-auto max-w-[1360px] px-6 lg:px-10">
        <div className="flex flex-col justify-between gap-8 border-b border-slate-200 pb-8 lg:flex-row lg:items-start">
          <div>
            <span className="font-serif text-lg font-semibold text-slate-900">
              Climate Connect
            </span>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500">
              Open-access climate intelligence and community resilience portal. All global and
              regional metrics cite primary meteorological and peer-reviewed scientific datasets.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-xs sm:grid-cols-3">
            <div>
              <p className="font-semibold text-slate-800">Sections</p>
              <ul className="mt-2.5 space-y-2 text-slate-500">
                <li>
                  <a href="#observatory" className="hover:text-slate-900">
                    Planetary Observatory
                  </a>
                </li>
                <li>
                  <a href="#local-lookup" className="hover:text-slate-900">
                    Local Lookup
                  </a>
                </li>
                <li>
                  <a href="#science-briefs" className="hover:text-slate-900">
                    Science Briefs
                  </a>
                </li>
                <li>
                  <a href="#action-hubs" className="hover:text-slate-900">
                    Action Hubs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-slate-800">Primary Data Authorities</p>
              <ul className="mt-2.5 space-y-2 text-slate-500">
                <li>
                  <a
                    href="https://www.ipcc.ch/report/ar6/syr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-900"
                  >
                    IPCC Sixth Assessment
                  </a>
                </li>
                <li>
                  <a
                    href="https://gml.noaa.gov/ccgg/trends/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-900"
                  >
                    NOAA Global Monitoring Lab
                  </a>
                </li>
                <li>
                  <a
                    href="https://data.giss.nasa.gov/gistemp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-900"
                  >
                    NASA GISS GISTEMP
                  </a>
                </li>
                <li>
                  <a
                    href="https://open-meteo.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-900"
                  >
                    Open-Meteo / Copernicus ERA5
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>Climate Connect Public Science Portal</span>
          <span>Data provenance verified against WMO, NOAA, NASA, NSIDC, and IPCC records</span>
        </div>
      </div>
    </footer>
  );
}
