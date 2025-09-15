# 🧠 MindCare AI

**Diario emocional inteligente con análisis de emociones usando IA (RoBERTa + Fallback)**

## Objetivo
- Analizar emociones en texto usando IA
- Guardar y mostrar historial emocional
- Proveer estadísticas básicas

## Stack
- **Backend:** FastAPI, Pydantic, SQLite, HuggingFace Transformers
- **Frontend:** HTML5, CSS3, JS ES6+
- **Infraestructura:** Uvicorn, StaticFiles

## Estructura de Carpetas

```
mindcare-ai/
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── dependencies.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── emotions.py
│   │       ├── analytics.py
│   │       └── health.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── emotion_analyzer.py
│   │   ├── text_processor.py
│   │   └── analytics_service.py
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── init_db.py
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   └── constants.py
│   └── utils/
│       ├── __init__.py
│       ├── logger.py
│       ├── exceptions.py
│       └── helpers.py
│
├── static/
│   ├── index.html
│   ├── css/
│   │   ├── styles.css
│   │   └── components.css
│   ├── js/
│   │   ├── app.js
│   │   ├── api.js
│   │   └── utils.js
│   └── assets/
│       ├── images/
│       └── icons/
│
├── data/
│   ├── mindcare.db
│   └── sample_data.json
│
├── tests/
│   ├── __init__.py
│   ├── test_api/
│   ├── test_services/
│   └── test_utils/
│
└── docs/
    ├── api.md
    ├── setup.md
    └── architecture.md
```
