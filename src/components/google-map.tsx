interface GoogleMapProps {
    address?: string;
    width?: string;
    height?: string;
    zoom?: number;
    className?: string;
}

export default function GoogleMap({
    address = "15 Rue André Citroën lot 15, 78140 Vélizy-Villacoublay",
    width = "100%",
    height = "400px",
    zoom = 15,
    className = ""
}: GoogleMapProps) {
    // Encode the address for the URL
    const encodedAddress = encodeURIComponent(address);

    // Google Maps Embed URL
    const mapSrc = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodedAddress}&zoom=${zoom}`;

    // Embed URL for your specific location in Vélizy-Villacoublay
    const embedSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2625.5!2d2.1847!3d48.7831!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e67f7e1b234567%3A0x1234567890abcdef!2s15%20Rue%20Andr%C3%A9%20Citro%C3%ABn%2C%2078140%20V%C3%A9lizy-Villacoublay%2C%20France!5e0!3m2!1sfr!2sfr!4v1234567890!5m2!1sfr!2sfr`;

    return (
        <div className={`w-full ${className}`}>
            <iframe
                src={embedSrc}
                width={width}
                height={height}
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Location"
                className="rounded-lg shadow-lg"
            />
        </div>
    );
}