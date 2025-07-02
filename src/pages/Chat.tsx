import React from 'react';
const Chat = () => {
  return <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">Haggle with Guy</h1>
          <p className="text-gray-600 text-center">and pick his ai-brain</p>
        </div>
        
        <div className="w-full">
          <iframe src="https://www.chatbase.co/chatbot-iframe/wC5yNdbQ-zPudnjFayCD2" width="100%" style={{
          height: '100%',
          minHeight: '700px'
        }} frameBorder="0" title="Chatbase Chatbot" />
        </div>
      </div>
    </div>;
};
export default Chat;