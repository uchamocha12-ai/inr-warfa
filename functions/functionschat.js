exports.handler = async (event, context) => {
  // 1. Solo permitir peticiones POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  // 2. Leer los mensajes enviados desde el frontend
  let messages;
  try {
    const body = JSON.parse(event.body);
    messages = body.messages || [];
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  // 3. Obtener la clave desde el entorno seguro de Netlify
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Error: Clave API no configurada en Netlify.' }) };
  }

  const systemPrompt = "Eres un asistente clínico especializado en anticoagulación con warfarina y manejo de INR. Responde de forma clara, concisa y basada en guías clínicas actuales. Incluye siempre un descargo: 'Esta información es de apoyo y no sustituye el criterio médico profesional.' No des diagnósticos ni ajustes de dosis sin supervisión médica explícita. Si el usuario menciona un valor de INR o dosis, sugiere consultar con el profesional tratante.";

  // 4. Llamar a Groq de forma segura
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    return { statusCode: response.status, body: JSON.stringify(data) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};