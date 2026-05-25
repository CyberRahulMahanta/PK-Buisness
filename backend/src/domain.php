<?php
declare(strict_types=1);

function find_accessible_document(PDO $db, string $documentId, array $requester, bool $adminAccess): array
{
    $document = fetch_one(
        $db,
        sprintf(
            'SELECT d.*, %s, %s, %s FROM documents d
             LEFT JOIN users u ON u.id = d.user_id
             LEFT JOIN users up ON up.id = d.uploaded_by_id
             LEFT JOIN users rv ON rv.id = d.reviewed_by_id
             WHERE d.id = :id LIMIT 1',
            user_join_sql('u', 'user__'),
            user_join_sql('up', 'uploaded_by__'),
            user_join_sql('rv', 'reviewed_by__'),
        ),
        [':id' => $documentId],
    );

    if ($document === null) {
        throw new AppError(404, 'Document not found');
    }

    if (!$adminAccess && (string) $document['user_id'] !== (string) $requester['id']) {
        throw new AppError(403, 'You do not have access to this document');
    }

    return $document;
}

function mark_service_in_progress_after_payment(PDO $db, ?string $serviceId): bool
{
    if ($serviceId === null || $serviceId === '') {
        return false;
    }

    $service = fetch_one($db, 'SELECT * FROM services WHERE id = :id LIMIT 1', [':id' => $serviceId]);

    if ($service === null) {
        return false;
    }

    $currentStatus = strtolower((string) ($service['status'] ?? 'pending'));

    if (in_array($currentStatus, ['rejected', 'completed', 'in progress'], true)) {
        return false;
    }

    update_row($db, 'services', [
        'status' => 'in progress',
        'completed_at' => null,
        'updated_at' => now_db(),
    ], 'id = :id', [':id' => $serviceId]);

    return true;
}

function create_payment_event(PDO $db, array $payload): void
{
    try {
        $details = $payload['payload'] ?? null;

        insert_row($db, 'payment_events', [
            'id' => uuid_v4(),
            'payment_id' => $payload['paymentId'] ?? null,
            'user_id' => $payload['userId'] ?? null,
            'event_type' => $payload['eventType'] ?? 'payment.event',
            'source' => $payload['source'] ?? 'system',
            'message' => $payload['message'] ?? '',
            'payload' => $details === null ? null : json_encode($details, JSON_UNESCAPED_SLASHES),
            'created_at' => now_db(),
        ]);
    } catch (Throwable $error) {
        error_log('Payment event logging failed: ' . $error->getMessage());
    }
}

function payment_is_receiptable(array $payment): bool
{
    return ($payment['status'] ?? '') === 'paid' || ($payment['verification_status'] ?? '') === 'verified';
}

function render_payment_receipt_html(array $payment): string
{
    $user = extract_prefixed_row($payment, 'user__');
    $clientName = $user['name'] ?? 'Client';
    $clientEmail = $user['email'] ?? '';
    $clientPhone = $user['phone'] ?? '';
    $paidAt = format_datetime_label($payment['paid_at'] ?? $payment['verified_at'] ?? $payment['updated_at'] ?? null);
    $amount = number_format((float) ($payment['amount'] ?? 0), 2);

    $escape = static fn (mixed $value): string => htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');

    return '<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ' . $escape($payment['invoice_number'] ?? '') . '</title>
  <style>
    body { color: #1f2933; font-family: Arial, sans-serif; margin: 0; padding: 32px; }
    .receipt { border: 1px solid #d7e2e4; margin: 0 auto; max-width: 760px; padding: 32px; }
    .top { align-items: flex-start; display: flex; justify-content: space-between; gap: 24px; }
    h1 { font-size: 26px; margin: 0 0 8px; }
    h2 { font-size: 16px; margin: 24px 0 8px; }
    p { color: #50606a; line-height: 1.5; margin: 4px 0; }
    table { border-collapse: collapse; margin-top: 20px; width: 100%; }
    th, td { border-bottom: 1px solid #e3ecee; padding: 12px 0; text-align: left; }
    th { color: #50606a; font-size: 12px; text-transform: uppercase; }
    .amount { color: #0d6b5d; font-size: 24px; font-weight: 700; text-align: right; }
    .print { margin: 0 auto 16px; max-width: 760px; text-align: right; }
    button { background: #0d6b5d; border: 0; border-radius: 6px; color: #fff; cursor: pointer; padding: 10px 16px; }
    @media print { body { padding: 0; } .print { display: none; } .receipt { border: 0; max-width: none; } }
  </style>
</head>
<body>
  <div class="print"><button onclick="window.print()">Print / Save PDF</button></div>
  <main class="receipt">
    <div class="top">
      <div>
        <h1>P.K Business Solution</h1>
        <p>Payment receipt</p>
      </div>
      <div>
        <p><strong>Invoice:</strong> ' . $escape($payment['invoice_number'] ?? '') . '</p>
        <p><strong>Date:</strong> ' . $escape($paidAt) . '</p>
      </div>
    </div>
    <h2>Client</h2>
    <p>' . $escape($clientName) . '</p>
    <p>' . $escape(trim($clientEmail . ' ' . $clientPhone)) . '</p>
    <table>
      <thead><tr><th>Service</th><th>Method</th><th>Transaction</th><th class="amount">Amount</th></tr></thead>
      <tbody>
        <tr>
          <td>' . $escape($payment['service_type'] ?? '') . '</td>
          <td>' . $escape(($payment['payment_method'] ?? 'online') === 'manual' ? 'Manual / UPI' : 'Online checkout') . '</td>
          <td>' . $escape(($payment['transaction_id'] ?? '') !== '' ? $payment['transaction_id'] : ($payment['razorpay_payment_id'] ?? '')) . '</td>
          <td class="amount">INR ' . $escape($amount) . '</td>
        </tr>
      </tbody>
    </table>
    <p>This receipt was generated after payment verification.</p>
  </main>
</body>
</html>';
}

function send_payment_receipt(array $payment): void
{
    if (!payment_is_receiptable($payment)) {
        throw new AppError(400, 'Receipt is available only after payment is verified');
    }

    $filename = preg_replace('/[^A-Za-z0-9_-]+/', '-', (string) ($payment['invoice_number'] ?? 'receipt'));
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: inline; filename="' . $filename . '.html"');
    echo render_payment_receipt_html($payment);
}

function derive_appointment_service_type(array $appointment, array $services, array $documents, array $payments): string
{
    if (!empty($appointment['service_type'])) {
        return $appointment['service_type'];
    }

    foreach ($services as $service) {
        if (!empty($service['type'])) {
            return $service['type'];
        }
    }

    foreach ($documents as $document) {
        if (!empty($document['service_type'])) {
            return $document['service_type'];
        }
    }

    foreach ($payments as $payment) {
        if (!empty($payment['service_type'])) {
            return $payment['service_type'];
        }
    }

    return 'General consultation';
}

function pick_latest_record_by_service(array $records, string $serviceType, string $field): ?array
{
    foreach ($records as $record) {
        if (($record[$field] ?? '') === $serviceType) {
            return $record;
        }
    }

    return $records[0] ?? null;
}

function build_user_summary_maps(PDO $db): array
{
    $documentRows = fetch_all(
        $db,
        "SELECT user_id, COUNT(*) AS total, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
         FROM documents GROUP BY user_id",
    );
    $serviceRows = fetch_all(
        $db,
        "SELECT user_id, COUNT(*) AS total,
                SUM(CASE WHEN status NOT IN ('rejected', 'completed') THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
         FROM services GROUP BY user_id",
    );
    $paymentRows = fetch_all(
        $db,
        "SELECT user_id, COUNT(*) AS total,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid,
                SUM(CASE WHEN status = 'pending' OR verification_status = 'pending' THEN 1 ELSE 0 END) AS pending
         FROM payments GROUP BY user_id",
    );
    $appointmentRows = fetch_all(
        $db,
        "SELECT user_id, COUNT(*) AS total,
                SUM(CASE WHEN status IN ('pending', 'approved', 'rescheduled') THEN 1 ELSE 0 END) AS pending
         FROM appointments GROUP BY user_id",
    );

    $maps = [
        'documentMap' => [],
        'serviceMap' => [],
        'paymentMap' => [],
        'appointmentMap' => [],
    ];

    foreach ($documentRows as $row) {
        $maps['documentMap'][(string) $row['user_id']] = [
            'total' => (int) $row['total'],
            'pending' => (int) $row['pending'],
        ];
    }

    foreach ($serviceRows as $row) {
        $maps['serviceMap'][(string) $row['user_id']] = [
            'total' => (int) $row['total'],
            'active' => (int) $row['active'],
            'completed' => (int) $row['completed'],
        ];
    }

    foreach ($paymentRows as $row) {
        $maps['paymentMap'][(string) $row['user_id']] = [
            'total' => (int) $row['total'],
            'paid' => (float) $row['paid'],
            'pending' => (int) $row['pending'],
        ];
    }

    foreach ($appointmentRows as $row) {
        $maps['appointmentMap'][(string) $row['user_id']] = [
            'total' => (int) $row['total'],
            'pending' => (int) $row['pending'],
        ];
    }

    return $maps;
}
