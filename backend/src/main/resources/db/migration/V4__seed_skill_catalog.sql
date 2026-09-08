-- SkillSwap Phase 3 Database Seed Migration
-- Seeds initial skill categories and skills catalog idempotently

-- 1. Skill Categories Seed
INSERT INTO skill_categories (id, name, description, created_at, updated_at)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Programming', 'Core programming languages and foundational software paradigms', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000002', 'Web Development', 'Frontend and backend web technologies, frameworks, and APIs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000003', 'Mobile Development', 'Native and cross-platform mobile application development', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000004', 'Data Science', 'Data analysis, querying, visualization, and statistical modeling', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000005', 'AI & Machine Learning', 'Artificial intelligence, machine learning, neural networks, and NLP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000006', 'Design', 'User interface, user experience, graphic design, and prototyping', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000007', 'Music', 'Musical instruments, vocal techniques, and audio production', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000008', 'Photography', 'Camera operation, lighting techniques, and photo post-processing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000009', 'Video', 'Video shooting, editing, motion graphics, and cinematography', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000010', 'Communication', 'Public speaking, presentations, interviews, and professional articulation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000011', 'Academic', 'University math, physics, engineering, and core theoretical courses', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0000000-0000-0000-0000-000000000012', 'Business', 'Finance, project management, startup fundamentals, and marketing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- 2. Skills Seed
-- Programming
INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000001', id, 'Python', 'General-purpose programming language for scripting, backend, and data', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Programming' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000002', id, 'Java', 'Object-oriented programming language for enterprise and Android systems', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Programming' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000003', id, 'C++', 'High-performance systems and competitive programming language', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Programming' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000004', id, 'C', 'Low-level systems programming language and memory fundamentals', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Programming' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000005', id, 'JavaScript', 'Core dynamic language of the modern web platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Programming' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000006', id, 'TypeScript', 'Strongly typed superset of JavaScript for large-scale applications', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Programming' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000007', id, 'Rust', 'Memory-safe systems programming language without garbage collection', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Programming' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000008', id, 'Go', 'Concurrent, statically typed language developed by Google', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Programming' ON CONFLICT (name) DO NOTHING;

-- Web Development
INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000010', id, 'React', 'Declarative UI library for building component-driven single page apps', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Web Development' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000011', id, 'Node.js', 'Server-side JavaScript runtime environment for scalable backends', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Web Development' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000012', id, 'HTML & CSS', 'Foundational markup and modern CSS styling including Flexbox and Grid', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Web Development' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000013', id, 'Angular', 'Comprehensive framework for building scalable enterprise web apps', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Web Development' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000014', id, 'Spring Boot', 'Opinionated Java framework for production-grade microservices and REST APIs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Web Development' ON CONFLICT (name) DO NOTHING;

-- AI & Machine Learning
INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000020', id, 'Machine Learning', 'Supervised and unsupervised algorithms, regression, and model evaluation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'AI & Machine Learning' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000021', id, 'Deep Learning', 'Neural networks, backpropagation, CNNs, and recurrent architectures', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'AI & Machine Learning' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000022', id, 'PyTorch', 'Open source deep learning framework for research and deployment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'AI & Machine Learning' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000023', id, 'TensorFlow', 'End-to-end open source platform for machine learning pipelines', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'AI & Machine Learning' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000024', id, 'NLP', 'Natural language processing, tokenization, transformers, and embeddings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'AI & Machine Learning' ON CONFLICT (name) DO NOTHING;

-- Design
INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000030', id, 'Figma', 'Collaborative interface design, wireframing, and interactive prototyping', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Design' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000031', id, 'UI Design', 'Visual design principles, color theory, typography, and design systems', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Design' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000032', id, 'UX Design', 'User research, persona creation, journey mapping, and usability testing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Design' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000033', id, 'Photoshop', 'Raster graphic editing, digital illustration, and photo manipulation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Design' ON CONFLICT (name) DO NOTHING;

-- Communication
INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000040', id, 'Public Speaking', 'Speech structuring, stage presence, audience engagement, and delivery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Communication' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000041', id, 'Presentation Skills', 'Designing impactful slide decks and pitching ideas convincingly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Communication' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000042', id, 'English Communication', 'Professional and academic spoken and written English fluency', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Communication' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000043', id, 'Interview Skills', 'Technical and behavioral interview frameworks (STAR method)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Communication' ON CONFLICT (name) DO NOTHING;

-- Music
INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000050', id, 'Guitar', 'Acoustic and electric guitar chords, fingerstyle, scales, and rhythm', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Music' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000051', id, 'Piano', 'Keyboard technique, sheet music reading, chord theory, and melodies', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Music' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000052', id, 'Music Production', 'DAW workflows (Ableton, FL Studio), mixing, and sound design', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Music' ON CONFLICT (name) DO NOTHING;

-- Academic
INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000060', id, 'Data Structures & Algorithms', 'Arrays, trees, graphs, sorting algorithms, and complexity analysis', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Academic' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000061', id, 'Linear Algebra', 'Vectors, matrices, eigenvalues, transformations, and applications', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Academic' ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (id, category_id, name, description, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000062', id, 'Calculus', 'Differentiation, integration, multivariate functions, and series', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM skill_categories WHERE name = 'Academic' ON CONFLICT (name) DO NOTHING;
