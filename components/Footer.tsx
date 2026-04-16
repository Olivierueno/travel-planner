export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 px-5 py-6 shrink-0">
      <div className="max-w-3xl mx-auto space-y-3 text-[11px] text-neutral-400 leading-relaxed">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[1.5px] text-neutral-500">
            UENO Systems
          </p>
          <p>&copy; {new Date().getFullYear()} UENO Systems. All rights reserved.</p>
        </div>

        <div className="border-t border-neutral-100 pt-3 space-y-2">
          <p>
            Travel Planner is developed and operated by UENO Systems as part
            of its modular, privacy-first infrastructure platform. The service
            is hosted on Vercel and designed for reliable, worldwide use.
          </p>

          <p>
            <span className="text-neutral-500 font-medium">Pricing.</span>{' '}
            Travel Planner operates on a transparent, usage-based pricing
            model. Users are charged only for the third-party services they
            consume (mapping, routing, geocoding) at cost, plus a small
            service fee to sustain ongoing development and infrastructure.
            There are no subscriptions, no hidden fees, and no minimum
            commitments.
          </p>

          <p>
            <span className="text-neutral-500 font-medium">Third-Party Services.</span>{' '}
            This application integrates with Google Maps Platform (Embed API,
            Distance Matrix API) for mapping and route calculation, Nominatim
            / OpenStreetMap for geocoding, and Wikimedia Commons for location
            imagery. Use of these services is subject to their respective
            terms. Google Maps content &copy; Google LLC. Map data &copy;
            OpenStreetMap contributors. Images sourced from Wikimedia Commons
            under applicable licenses.
          </p>

          <p>
            <span className="text-neutral-500 font-medium">Privacy &amp; Data.</span>{' '}
            Trip data is stored securely on the deployment infrastructure. We
            do not collect, sell, or share personal information. Access is
            protected by password-based authentication with cryptographically
            signed sessions. All API credentials are user-provisioned and
            environment-scoped. HTTPS is enforced in production.
          </p>

          <p>
            <span className="text-neutral-500 font-medium">Disclaimer.</span>{' '}
            This software is provided &ldquo;as is&rdquo; without warranty of
            any kind, express or implied, including but not limited to the
            warranties of merchantability, fitness for a particular purpose,
            and noninfringement. Travel times, distances, and costs are
            estimates provided by third-party services and may not reflect
            actual conditions. Users should independently verify all critical
            travel information. UENO Systems shall not be liable for any
            claim, damages, or other liability arising from the use of this
            application.
          </p>
        </div>
      </div>
    </footer>
  );
}
