export default async function handler(req, res) {
    // Configurações de CORS para o navegador aceitar a resposta
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const dados = req.body;

    // --- PARTE 1: GERAÇÃO DE PIX ---
    if (dados.action === 'create_payment') {
        const { amount, username, cpf } = dados;
        
        // Suas chaves da DivPag
        const API_TOKEN = "wrmonteiro_4001873957"; 
        const API_SECRET = "436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d";

        try {
            // Chamada direta para a DivPag
            const responsePix = await fetch('https://api.divpag.com.br/v1/pix/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'X-Api-Secret': API_SECRET,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    external_id: username,
                    payer_question: `Deposito para ${username}`,
                    payer_cpf: cpf ? cpf.replace(/\D/g, '') : "00000000000"
                })
            });

            const data = await responsePix.json();

            // REGISTRO NO SUPABASE (Via API direta, sem precisar de biblioteca)
            if (responsePix.ok && process.env.SUPABASE_URL) {
                await fetch(`${process.env.SUPABASE_URL}/rest/v1/transacoes`, {
                    method: 'POST',
                    headers: {
                        'apikey': process.env.SUPABASE_KEY,
                        'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        usuario: username,
                        valor: amount,
                        tipo: 'deposito',
                        status: 'pendente',
                        id_transacao_ext: String(data.transaction_id || data.id)
                    })
                });
            }

            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Erro Interno", message: error.message });
        }
    }

    return res.status(200).json({ status: "OK" });
}
