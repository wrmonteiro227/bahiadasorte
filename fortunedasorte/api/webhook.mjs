import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { amount, username, cpf, action } = req.body;

        if (action === 'create_payment') {
            const API_TOKEN = "wrmonteiro_4001873957"; 
            const API_SECRET = "436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d";

            // 1. GERAÇÃO DO PIX
            const resDivPag = await fetch('https://api.divpag.com.br/v1/pix/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'X-Api-Secret': API_SECRET,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    external_id: String(username),
                    payer_question: `Deposito ${username}`,
                    payer_cpf: cpf ? String(cpf).replace(/\D/g, '') : "00000000000"
                })
            });

            const dataPix = await resDivPag.json();

            // 2. REGISTRO NO SUPABASE (Com trava para não quebrar o PIX se o banco falhar)
            try {
                if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
                    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
                    await supabase.from('transacoes').insert([{
                        usuario: username,
                        valor: parseFloat(amount),
                        tipo: 'deposito',
                        status: 'pendente',
                        id_transacao_ext: String(dataPix.transaction_id || dataPix.id || 'sem_id')
                    }]);
                }
            } catch (dbError) {
                console.error("Erro no banco:", dbError.message);
            }

            return res.status(200).json(dataPix);
        }
        return res.status(200).json({ status: "ok" });

    } catch (error) {
        // Força a resposta de erro a ser JSON para não dar o erro do "Token A"
        return res.status(200).json({ error: true, message: error.message });
    }
}
