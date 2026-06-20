from app.database import Base, engine
from app.models.customers import Customer
from sqlalchemy import inspect

print('Checking database tables...')
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f'Existing tables: {tables}')

if 'customers' in tables:
    print('✅ Customers table exists')
    columns = [col['name'] for col in inspector.get_columns('customers')]
    print(f'Columns: {columns}')
else:
    print('⚠️  Customers table missing, creating...')
    Base.metadata.create_all(bind=engine)
    print('✅ Tables created')
