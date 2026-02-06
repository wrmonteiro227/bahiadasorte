import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // COLOQUE SEUS DADOS AQUI DENTRO DAS ASPAS (SUBSTITUA OS TEXTOS ABAIXO)
    const MINHA_URL = "https://zqvfnykxwlcozvawqgrn.supabase.co"; // Ex: https://xyz.supabase.co
    const MINHA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdmZueWt4d2xjb3p2YXdxZ3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDkzNDQsImV4cCI6MjA4NTMyNTM0NH0.CevpF9vP4748mb2vFNsOp5Kq6u7Nfp_100bJcW7ogUQ"; 
    // -------------------------------------------------------------------

    const supabase = createClient(MINHA_URL, MINHA_KEY);

    const { action, amount, username, cpf } = req.body;

    if (action === 'create_payment') {
        try {
            const responsePix = await fetch('https://api.divpag.com.br/v1/pix/generate', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer wrmonteiro_4001873957',
                    'X-Api-Secret': '436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d',
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

            if (responsePix.ok) {
                await supabase.from('transacoes').insert([{
                    usuario: username,
                    valor: amount,
                    tipo: 'deposito',
                    status: 'pendente',
                    id_transacao_ext: String(data.transaction_id || data.id)
                }]);
            }

            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    return res.status(200).json({ status: "OK" });
}
