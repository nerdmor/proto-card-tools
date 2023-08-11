from flask import Blueprint, jsonify

bp_errors = Blueprint('errors', __name__)

@bp_errors.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'page not found'})

@bp_errors.errorhandler(401)
def denied(e):
    return jsonify({'error': 'unuthorized'})

@bp_errors.errorhandler(418)
def teapot(e):
    return jsonify({'error': 'short and stout'})