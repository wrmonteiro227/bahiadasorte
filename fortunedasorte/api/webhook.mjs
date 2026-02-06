import { createClient } from '@supabase/supabase-js';

// Inicializa o Supabase usando as variáveis de ambiente da Vercel
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    // Configurações de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const dados = req.body;

    // --- GERAÇÃO DE PIX (Ação disparada pelo seu botão) ---
    if (dados.action === 'create_payment') {
        const { amount, username, cpf } = dados;

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
                // REGISTRA NO SUPABASE (Mantendo suas colunas: usuario, valor, tipo, status, id_transacao_ext)
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

    // --- RECEBIMENTO (Webhook que a DivPag chama quando o cara paga) ---
    try {
        const idTransacaoExt = String(dados.id || dados.transactionId || dados.paymentId);
        const statusNotificacao = (dados.status || dados.currentState || "").toLowerCase();
        const foiPago = ['paid', 'completed', 'approved', 'confirmed', 'sucesso'].includes(statusNotificacao);

        if (foiPago && idTransacaoExt) {
            const { data: transacao } = await supabase
                .from('transacoes')
                .select('*')
                .eq('id_transacao_ext', idTransacaoExt)
                .single();

            if (transacao && transacao.status !== 'aprovado') {
                const { data: user } = await supabase
                    .from('usuarios')
                    .select('saldo')
                    .eq('username', transacao.usuario)
                    .single();

                const novoSaldo = parseFloat(user.saldo || 0) + parseFloat(transacao.valor);

                await supabase.from('usuarios').update({ saldo: novoSaldo }).eq('username', transacao.usuario);
                await supabase.from('transacoes').update({ status: 'aprovado' }).eq('id', transacao.id);

                return res.status(200).json({ success: true });
            }
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }

    return res.status(200).json({ status: "OK" });
}
