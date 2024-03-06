from flask import Flask, render_template, jsonify,request
from pymongo import MongoClient
from datetime import datetime
import json
from bson.json_util import dumps

app = Flask(__name__)

# MongoDB connection
client = MongoClient('mongodb://localhost:27017')
db = client['healthrecorddb']
heart_rate_collection = db['heart_rate']

@app.route('/api/heart_rate', methods=['POST'])
def record_heart_rate():
    try:
        # Example data sent in the request JSON
        data = request.json
        user_id = data.get('user_id')
        heart_rate = data.get('heart_rate')

        # Save data to MongoDB
        timestamp = datetime.utcnow()
        record = {
            'user_id': user_id,
            'heart_rate': heart_rate,
            'timestamp': timestamp
        }
        result = heart_rate_collection.insert_one(record)

        return jsonify({'success': True, 'message': 'Heart rate recorded successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/analytics')
def analytics():
    # Fetch data from MongoDB
    data = list(heart_rate_collection.find({}, {'_id': 0}))

    # Prepare data for charts
    timestamps = [entry['timestamp'] for entry in data]
    heart_rates = [entry['heart_rate'] for entry in data]

    # Group heart rates into categories
    categories = {'<40': 0, '40-120': 0, '>120': 0}
    for rate in heart_rates:
        if rate < 40:
            categories['<40'] += 1
        elif 40 <= rate <= 120:
            categories['40-120'] += 1
        else:
            categories['>120'] += 1

    # Pass data to the template
    return render_template('analytics.html', timestamps=timestamps, heart_rates=heart_rates, categories=categories)

if __name__ == '__main__':
    app.run(debug=True)
