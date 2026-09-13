package database

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type Cache interface {
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Get(ctx context.Context, key string) (string, error)
	Del(ctx context.Context, keys ...string) error
	Incr(ctx context.Context, key string) (int64, error)
	Expire(ctx context.Context, key string, expiration time.Duration) error
}

type RedisClient struct {
	rdb *redis.Client
}

func NewRedisClient(redisURL string) (Cache, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("invalid redis url: %w", err)
	}

	rdb := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Redis ping failed (%v). Falling back to in-memory mock cache for standalone operations.\n", err)
		return NewInMemoryCache(), nil
	}

	log.Println("Connected to Redis successfully")
	return &RedisClient{rdb: rdb}, nil
}

func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return r.rdb.Set(ctx, key, value, expiration).Err()
}

func (r *RedisClient) Get(ctx context.Context, key string) (string, error) {
	return r.rdb.Get(ctx, key).Result()
}

func (r *RedisClient) Del(ctx context.Context, keys ...string) error {
	return r.rdb.Del(ctx, keys...).Err()
}

func (r *RedisClient) Incr(ctx context.Context, key string) (int64, error) {
	return r.rdb.Incr(ctx, key).Result()
}

func (r *RedisClient) Expire(ctx context.Context, key string, expiration time.Duration) error {
	return r.rdb.Expire(ctx, key, expiration).Err()
}

// InMemoryCache provides transparent fallback when Redis is not started
type inMemoryItem struct {
	value     string
	expiresAt time.Time
}

type InMemoryCache struct {
	mu    sync.RWMutex
	items map[string]inMemoryItem
}

func NewInMemoryCache() *InMemoryCache {
	return &InMemoryCache{
		items: make(map[string]inMemoryItem),
	}
}

func (m *InMemoryCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	var exp time.Time
	if expiration > 0 {
		exp = time.Now().Add(expiration)
	}

	m.items[key] = inMemoryItem{
		value:     fmt.Sprintf("%v", value),
		expiresAt: exp,
	}
	return nil
}

func (m *InMemoryCache) Get(ctx context.Context, key string) (string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	item, exists := m.items[key]
	if !exists {
		return "", redis.Nil
	}

	if !item.expiresAt.IsZero() && time.Now().After(item.expiresAt) {
		return "", redis.Nil
	}

	return item.value, nil
}

func (m *InMemoryCache) Del(ctx context.Context, keys ...string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for _, k := range keys {
		delete(m.items, k)
	}
	return nil
}

func (m *InMemoryCache) Incr(ctx context.Context, key string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	item, exists := m.items[key]
	var current int64 = 0
	if exists && (item.expiresAt.IsZero() || time.Now().Before(item.expiresAt)) {
		fmt.Sscanf(item.value, "%d", &current)
	}
	current++
	m.items[key] = inMemoryItem{
		value:     fmt.Sprintf("%d", current),
		expiresAt: item.expiresAt,
	}
	return current, nil
}

func (m *InMemoryCache) Expire(ctx context.Context, key string, expiration time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	item, exists := m.items[key]
	if !exists {
		return nil
	}
	item.expiresAt = time.Now().Add(expiration)
	m.items[key] = item
	return nil
}
