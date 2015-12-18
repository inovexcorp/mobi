package org.matonto.repository.impl.sesame.nativestore;

import aQute.bnd.annotation.metatype.Meta;
import org.matonto.repository.config.RepositoryConfig;

import java.util.Set;

/**
 * Configuration for on-disk, indexed Repository objects. It uses B-Trees for indexing statements, where
 * the index key consists of four fields: subject (s), predicate (p), object (o) and context (c). The order
 * in which each of these fields is used in the key determines the usability of an index on a specify statement
 * query pattern: searching statements with a specific subject in an index that has the subject as the first
 * field is significantly faster than searching these same statements in an index where the subject field is
 * second or third. In the worst case, the 'wrong' statement pattern will result in a sequential scan over
 * the entire set of statements.
 *
 * The native store automatically creates/drops indexes upon (re)initialization, so the parameter can be
 * adjusted and upon the first refresh of the configuration the native store will change its indexing strategy,
 * without loss of data.
 */
public interface NativeRepositoryConfig extends RepositoryConfig {

    /**
     * The triple indexes for the native store. Default value is: "spoc,posc"
     *
     * @return The Set of String representing triple indexes.
     */
    @Meta.AD(required = false)
    Set<String> tripleIndexes();
}
