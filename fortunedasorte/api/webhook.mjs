import fetch from 'node-fetch'; // Importação explícita para evitar o "fetch failed"
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { amount, username, cpf, action } = req.body;

    if (action === 'create_payment') {
        try {
            // 1. Chamada para DivPag
            const responsePix = await fetch('https://api.divpag.com.br/v1/pix/generate', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer wrmonteiro_4001873957',
                    'X-Api-Secret': '436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    external_id: String(username),
                    payer_question: `Deposito ${username}`,
                    payer_cpf: cpf ? String(cpf).replace(/\D/g, '') : "00000000000"
                })
            });

            if (!responsePix.ok) {
                const erroTexto = await responsePix.text();
                return res.status(400).json({ error: "Erro na DivPag", detalhes: erroTexto });
            }

            const dataPix = await responsePix.json();

            // 2. Gravação no Supabase (Blindada)
            try {
                const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
                await supabase.from('transacoes').insert([{
                    usuario: username,
                    valor: parseFloat(amount),
                    tipo: 'deposito',
                    status: 'pendente',
                    id_transacao_ext: String(dataPix.transaction_id || dataPix.id || 'sem_id')
                }]);
            } catch (supaErr) {
                console.log("Erro banco (ignorado para gerar PIX):", supaErr.message);
            }

            return res.status(200).json(dataPix);

        } catch (error) {
            // Se o fetch falhar, ele cai aqui
            return res.status(500).json({ error: "Falha de rede (fetch failed)", message: error.message });
        }
    }
    return res.status(200).json({ ok: true });
}
