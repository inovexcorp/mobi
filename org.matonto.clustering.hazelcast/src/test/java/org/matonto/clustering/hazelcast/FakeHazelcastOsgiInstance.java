package org.matonto.clustering.hazelcast;

import com.hazelcast.cardinality.CardinalityEstimator;
import com.hazelcast.config.Config;
import com.hazelcast.core.ClientService;
import com.hazelcast.core.Cluster;
import com.hazelcast.core.DistributedObject;
import com.hazelcast.core.DistributedObjectListener;
import com.hazelcast.core.Endpoint;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.IAtomicLong;
import com.hazelcast.core.IAtomicReference;
import com.hazelcast.core.ICacheManager;
import com.hazelcast.core.ICountDownLatch;
import com.hazelcast.core.IExecutorService;
import com.hazelcast.core.IList;
import com.hazelcast.core.ILock;
import com.hazelcast.core.IMap;
import com.hazelcast.core.IQueue;
import com.hazelcast.core.ISemaphore;
import com.hazelcast.core.ISet;
import com.hazelcast.core.ITopic;
import com.hazelcast.core.IdGenerator;
import com.hazelcast.core.LifecycleService;
import com.hazelcast.core.MultiMap;
import com.hazelcast.core.PartitionService;
import com.hazelcast.core.ReplicatedMap;
import com.hazelcast.durableexecutor.DurableExecutorService;
import com.hazelcast.logging.LoggingService;
import com.hazelcast.mapreduce.JobTracker;
import com.hazelcast.osgi.HazelcastOSGiInstance;
import com.hazelcast.osgi.HazelcastOSGiService;
import com.hazelcast.quorum.QuorumService;
import com.hazelcast.ringbuffer.Ringbuffer;
import com.hazelcast.scheduledexecutor.IScheduledExecutorService;
import com.hazelcast.transaction.HazelcastXAResource;
import com.hazelcast.transaction.TransactionContext;
import com.hazelcast.transaction.TransactionException;
import com.hazelcast.transaction.TransactionOptions;
import com.hazelcast.transaction.TransactionalTask;

import java.util.Collection;
import java.util.concurrent.ConcurrentMap;

public class FakeHazelcastOsgiInstance implements HazelcastOSGiInstance {

    private final HazelcastInstance instance;

    private final HazelcastOSGiService service;

    public FakeHazelcastOsgiInstance(HazelcastInstance inst, HazelcastOSGiService service) {
        this.instance = inst;
        this.service = service;
    }

    @Override
    public HazelcastInstance getDelegatedInstance() {
        return this.instance;
    }

    @Override
    public HazelcastOSGiService getOwnerService() {
        return this.service;
    }

    @Override
    public String getName() {
        return null;
    }

    @Override
    public <E> IQueue<E> getQueue(String name) {
        return getDelegatedInstance().getQueue(name);
    }

    @Override
    public <E> ITopic<E> getTopic(String name) {
        return getDelegatedInstance().getTopic(name);
    }

    @Override
    public <E> ISet<E> getSet(String name) {
        return getDelegatedInstance().getSet(name);
    }

    @Override
    public <E> IList<E> getList(String name) {
        return getDelegatedInstance().getList(name);
    }

    @Override
    public <K, V> IMap<K, V> getMap(String name) {
        return getDelegatedInstance().getMap(name);
    }

    @Override
    public <K, V> ReplicatedMap<K, V> getReplicatedMap(String name) {
        return getDelegatedInstance().getReplicatedMap(name);
    }

    @Override
    public JobTracker getJobTracker(String name) {
        return getDelegatedInstance().getJobTracker(name);
    }

    @Override
    public <K, V> MultiMap<K, V> getMultiMap(String name) {
        return getDelegatedInstance().getMultiMap(name);
    }

    @Override
    public ILock getLock(String key) {
        return getDelegatedInstance().getLock(key);
    }

    @Override
    public <E> Ringbuffer<E> getRingbuffer(String name) {
        return getDelegatedInstance().getRingbuffer(name);
    }

    @Override
    public <E> ITopic<E> getReliableTopic(String name) {
        return getDelegatedInstance().getReliableTopic(name);
    }

    @Override
    public Cluster getCluster() {
        return getDelegatedInstance().getCluster();
    }

    @Override
    public Endpoint getLocalEndpoint() {
        return getDelegatedInstance().getLocalEndpoint();
    }

    @Override
    public IExecutorService getExecutorService(String name) {
        return getDelegatedInstance().getExecutorService(name);
    }

    @Override
    public DurableExecutorService getDurableExecutorService(String name) {
        return getDelegatedInstance().getDurableExecutorService(name);
    }

    @Override
    public <T> T executeTransaction(TransactionalTask<T> task) throws TransactionException {
        return getDelegatedInstance().executeTransaction(task);
    }

    @Override
    public <T> T executeTransaction(TransactionOptions options, TransactionalTask<T> task) throws TransactionException {
        return getDelegatedInstance().executeTransaction(options,task);
    }

    @Override
    public TransactionContext newTransactionContext() {
        return getDelegatedInstance().newTransactionContext();
    }

    @Override
    public TransactionContext newTransactionContext(TransactionOptions options) {
        return getDelegatedInstance().newTransactionContext(options);
    }

    @Override
    public IdGenerator getIdGenerator(String name) {
        return getDelegatedInstance().getIdGenerator(name);
    }

    @Override
    public IAtomicLong getAtomicLong(String name) {
        return getDelegatedInstance().getAtomicLong(name);
    }

    @Override
    public <E> IAtomicReference<E> getAtomicReference(String name) {
        return getDelegatedInstance().getAtomicReference(name);
    }

    @Override
    public ICountDownLatch getCountDownLatch(String name) {
        return getDelegatedInstance().getCountDownLatch(name);
    }

    @Override
    public ISemaphore getSemaphore(String name) {
        return getDelegatedInstance().getSemaphore(name);
    }

    @Override
    public Collection<DistributedObject> getDistributedObjects() {
        return getDelegatedInstance().getDistributedObjects();
    }

    @Override
    public String addDistributedObjectListener(DistributedObjectListener distributedObjectListener) {
        return getDelegatedInstance().addDistributedObjectListener(distributedObjectListener);
    }

    @Override
    public boolean removeDistributedObjectListener(String registrationId) {
        return getDelegatedInstance().removeDistributedObjectListener(registrationId);
    }

    @Override
    public Config getConfig() {
        return getDelegatedInstance().getConfig();
    }

    @Override
    public PartitionService getPartitionService() {
        return getDelegatedInstance().getPartitionService();
    }

    @Override
    public QuorumService getQuorumService() {
        return getDelegatedInstance().getQuorumService();
    }

    @Override
    public ClientService getClientService() {
        return getDelegatedInstance().getClientService();
    }

    @Override
    public LoggingService getLoggingService() {
        return getDelegatedInstance().getLoggingService();
    }

    @Override
    public LifecycleService getLifecycleService() {
        return getDelegatedInstance().getLifecycleService();
    }

    @Override
    public <T extends DistributedObject> T getDistributedObject(String serviceName, String name) {
        return getDelegatedInstance().getDistributedObject(serviceName,name);
    }

    @Override
    public ConcurrentMap<String, Object> getUserContext() {
        return getDelegatedInstance().getUserContext();
    }

    @Override
    public HazelcastXAResource getXAResource() {
        return getDelegatedInstance().getXAResource();
    }

    @Override
    public ICacheManager getCacheManager() {
        return getDelegatedInstance().getCacheManager();
    }

    @Override
    public CardinalityEstimator getCardinalityEstimator(String name) {
        return getDelegatedInstance().getCardinalityEstimator(name);
    }

    @Override
    public IScheduledExecutorService getScheduledExecutorService(String name) {
        return getDelegatedInstance().getScheduledExecutorService(name);
    }

    @Override
    public void shutdown() {
        getDelegatedInstance().shutdown();
    }
}
