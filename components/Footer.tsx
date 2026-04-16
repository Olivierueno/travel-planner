export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 px-5 py-6 text-[11px] text-neutral-400 leading-relaxed">
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[1.5px] text-neutral-500">
            UENO Systems
          </p>
          <p>&copy; {new Date().getFullYear()} UENO Systems. All rights reserved.</p>
        </div>

        <div className="border-t border-neutral-100 pt-3 space-y-2">
          <p>
            Travel Planner is a product of UENO Systems &mdash; a modular,
            privacy-first personal infrastructure platform. This application is
            provided for collaborative trip planning and is designed for
            worldwide public use.
          </p>

          <p>
            <span className="text-neutral-500 font-medium">Pricing.</span>{' '}
            Travel Planner operates on a usage-based model. You are charged
            only for the third-party services you consume (mapping, routing,
            geocoding) plus a small service fee to sustain development and
            infrastructure. There are no subscriptions, no hidden fees, and no
            minimum commitments. Our goal is to keep costs as low as possible
            for every user.
          </p>

          <p>
            <span className="text-neutral-500 font-medium">Third-Party Services.</span>{' '}
            This application uses Google Maps Platform (Embed API, Distance
            Matrix API) for mapping and routing, Nominatim / OpenStreetMap for
            geocoding, and Wikimedia Commons for location imagery. Use of these
            services is subject to their respective terms. Google Maps content
            is &copy; Google LLC. Map data &copy; OpenStreetMap contributors.
            Images sourced from Wikimedia Commons under applicable licenses.
          </p>

          <p>
            <span className="text-neutral-500 font-medium">Privacy &amp; Security.</span>{' '}
            Trip data is stored on the infrastructure you deploy to (Vercel KV
            or local storage). We do not collect, sell, or share personal data.
            Access is protected by password-based authentication with signed
            JWT sessions. All API keys are user-provisioned and
            environment-scoped. We recommend restricting API keys by domain and
            enabling HTTPS in production.
          </p>

          <p>
            <span className="text-neutral-500 font-medium">Disclaimer.</span>{' '}
            This software is provided &ldquo;as is&rdquo; without warranty of
            any kind, express or implied. Travel times, distances, and costs
            are estimates provided by third-party services and may not reflect
            actual conditions. Always verify critical travel information
            independently. UENO Systems is not liable for any decisions made
            based on data presented by this application.
          </p>
        </div>
      </div>
    </footer>
  );
}
