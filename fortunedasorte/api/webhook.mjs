import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // 1. Configuração de Headers (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST permitido' });

    // 2. Inicialização segura do Supabase dentro do handler
    const supabase = createClient(
        process.env.SUPABASE_URL || '', 
        process.env.SUPABASE_KEY || ''
    );

    const dados = req.body;

    // --- PARTE 1: GERAÇÃO DE PIX ---
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
                // Registro no banco com as colunas que você confirmou
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
            console.error("Erro interno:", error.message);
            return res.status(500).json({ error: "Falha no servidor", detalhes: error.message });
        }
    }

    // --- PARTE 2: WEBHOOK DE RECEBIMENTO ---
    // (Opcional por enquanto, para não complicar o teste do PIX)
    return res.status(200).json({ status: "OK" });
}
