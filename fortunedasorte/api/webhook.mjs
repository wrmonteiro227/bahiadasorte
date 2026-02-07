import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { amount, username, cpf, action } = req.body;

        if (action === 'create_payment') {
            // 1. Tentar gerar o PIX na DivPag primeiro
            const resDivPag = await fetch('https://api.divpag.com.br/v1/pix/generate', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer wrmonteiro_4001873957',
                    'X-Api-Secret': '436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: parseFloat(amount), // Força ser número
                    external_id: username,
                    payer_question: `Deposito ${username}`,
                    payer_cpf: cpf ? cpf.replace(/\D/g, '') : "00000000000"
                })
            });

            const dataPix = await resDivPag.json();

            if (!resDivPag.ok) {
                return res.status(400).json({ error: "Erro DivPag", detalhes: dataPix });
            }

            // 2. Tentar salvar no Supabase (Se falhar, o PIX ainda é enviado)
            try {
                const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
                await supabase.from('transacoes').insert([{
                    usuario: username,
                    valor: parseFloat(amount),
                    tipo: 'deposito',
                    status: 'pendente',
                    id_transacao_ext: String(dataPix.transaction_id || dataPix.id)
                }]);
            } catch (err) {
                console.error("Erro Supabase (mas PIX gerado):", err.message);
            }

            // Retorna o PIX para o usuário
            return res.status(200).json(dataPix);
        }

        return res.status(200).json({ status: "OK" });

    } catch (error) {
        // Retorna o erro real em vez de apenas 500
        return res.status(500).json({ error: "Erro no Servidor", message: error.message });
    }
}
