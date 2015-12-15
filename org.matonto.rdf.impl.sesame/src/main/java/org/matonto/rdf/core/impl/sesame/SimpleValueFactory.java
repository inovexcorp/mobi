package org.matonto.rdf.core.impl.sesame;

public class SimpleValueFactory extends AbstractValueFactory {

    private SimpleValueFactory() {}

    /**
     * SingletonHolder is loaded on the first execution of SimpleValueFactory.getInstance()
     * or the first access to SingletonHolder.INSTANCE, not before.
     */
    private static class SingletonHolder {
        private static final SimpleValueFactory INSTANCE = new SimpleValueFactory();
    }

    /**
     * Provide a single shared instance of a SimpleValueFactory.
     *
     * @return a singleton instance of SimpleValueFactory.
     */
    public static SimpleValueFactory getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
