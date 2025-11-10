-- Populate the benchmark dataset only when the tables are empty.

INSERT INTO category (code, name)
SELECT format('CAT%04s', series_id),
       format('Catégorie %s', to_char(series_id, 'FM0000'))
FROM generate_series(1, 2000) AS series_id
WHERE NOT EXISTS (SELECT 1 FROM category)
ON CONFLICT (code) DO NOTHING;

-- Generate 50 items per category (100 000 items in total) with ~5 KB descriptions.
INSERT INTO item (sku, name, price, stock, description, category_id)
SELECT
    format('SKU-%s-%s', cat.code, to_char(item_index, 'FM000')),
    format('Produit %s %s', to_char(item_index, 'FM000'), cat.name),
    ROUND(19.99 + ((item_index - 1) * 0.95) + ((cat.id % 7) * 1.15), 2),
    15 + ((cat.id + item_index * 7) % 35),
    LEFT(
        format(
            'Description lourde pour le produit %s de la catégorie %s. ',
            format('SKU-%s-%s', cat.code, to_char(item_index, 'FM000')),
            cat.code
        ) ||
        repeat(
            'Ce bloc simule un payload volumineux pour les scénarios JMeter heavy-body. ',
            200
        ),
        5120
    ),
    cat.id
FROM category AS cat
CROSS JOIN generate_series(1, 50) AS item_index
WHERE NOT EXISTS (SELECT 1 FROM item)
ON CONFLICT (sku) DO NOTHING;

-- Align sequences with the highest identifiers present (safe for repeated executions).
SELECT setval(pg_get_serial_sequence('category', 'id'), COALESCE(MAX(id), 0), true) FROM category;
SELECT setval(pg_get_serial_sequence('item', 'id'), COALESCE(MAX(id), 0), true) FROM item;


