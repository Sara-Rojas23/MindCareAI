# Funciones helper generales

def to_dict(obj) -> dict:
    """Convierte un objeto a dict si es posible."""
    if hasattr(obj, 'dict'):
        return obj.dict()
    return dict(obj)
