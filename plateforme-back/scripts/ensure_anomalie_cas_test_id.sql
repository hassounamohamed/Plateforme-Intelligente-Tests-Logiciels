-- A executer en tant que proprietaire de la table anomalie (souvent postgres)
ALTER TABLE anomalie ADD COLUMN IF NOT EXISTS cas_test_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_anomalie_cas_test_id'
    ) THEN
        ALTER TABLE anomalie
        ADD CONSTRAINT fk_anomalie_cas_test_id
        FOREIGN KEY (cas_test_id) REFERENCES cas_test(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_anomalie_cas_test_id ON anomalie (cas_test_id);
