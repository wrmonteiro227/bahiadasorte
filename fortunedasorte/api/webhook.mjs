import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // --- COLOQUE SEUS DADOS REAIS AQUI DENTRO DAS ASPAS ---
    const SUPABASE_URL = "https://zqvfnykxwlcozvawqgrn.supabase.co"; 
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdmZueWt4d2xjb3p2YXdxZ3JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc0OTM0NCwiZXhwIjoyMDg1MzI1MzQ0fQ.csbTXCdRjD4EEb7ZvIV2C23a9DaLVFVE2BK7hq2Y1Ow";
    // -----------------------------------------------------

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const dados = req.body;

    if (dados.action === 'create_payment') {
        const { amount, username, cpf } = dados;
        const API_TOKEN = "wrmonteiro_4001873957"; 
        const API_SECRET = "436fc76ab41e0cfbb1aff11c7efea600c9cd36624a95ac935f7d68da8e3f596d";

        try {
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
