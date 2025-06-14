
import React from 'react';

const VoiceResponseXML = () => {
  // Set the content type to XML
  React.useEffect(() => {
    // Set response headers for XML content
    const setHeaders = () => {
      if (typeof document !== 'undefined') {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Type';
        meta.content = 'application/xml; charset=utf-8';
        document.head.appendChild(meta);
      }
    };
    setHeaders();
  }, []);

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
<Say voice="woman">Thanks for the call. Configure your number's voice U R L to change this message.</Say>
<Pause length="1"/>
<Say voice="woman">Let us know if we can help you in any way during your development.</Say>
</Response>`;

  return (
    <div>
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        {xmlContent}
      </pre>
    </div>
  );
};

export default VoiceResponseXML;
