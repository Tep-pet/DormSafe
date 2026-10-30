-- Contact email for student inquiries and direct landlord communication

ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_email TEXT;
