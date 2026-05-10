-- drop mudarabah_detail, no longer needed
DROP TABLE mudarabah_detail;

-- monthly pool cycle
CREATE TABLE mudarabah_cycle (
    cycle_id            INT AUTO_INCREMENT PRIMARY KEY,
    cycle_month         DATE NOT NULL UNIQUE,
    pool_total          DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    profit_loss_percent DECIMAL(8,4),
    profit_loss_amount  DECIMAL(15,2),
    status              ENUM('open', 'frozen', 'settled') NOT NULL DEFAULT 'open',
    open_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    frozen_at           TIMESTAMP NULL,
    settled_at          TIMESTAMP NULL,
    CONSTRAINT chk_pool_total CHECK (pool_total >= 0)
);

-- per account snapshot at freeze time
CREATE TABLE mudarabah_cycle_entry (
    entry_id            INT AUTO_INCREMENT PRIMARY KEY,
    cycle_id            INT            NOT NULL,
    account_id          INT            NOT NULL,
    balance_at_freeze   DECIMAL(15,2)  NOT NULL,
    share_percent       DECIMAL(8,6)   NOT NULL,
    profit_loss_amount  DECIMAL(15,2),
    settled             BOOLEAN        NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_balance_freeze CHECK (balance_at_freeze >= 0),
    CONSTRAINT chk_share CHECK (share_percent >= 0 AND share_percent <= 1),
    CONSTRAINT uq_cycle_account UNIQUE (cycle_id, account_id),
    FOREIGN KEY (cycle_id)   REFERENCES mudarabah_cycle(cycle_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)      ON DELETE RESTRICT ON UPDATE CASCADE
);