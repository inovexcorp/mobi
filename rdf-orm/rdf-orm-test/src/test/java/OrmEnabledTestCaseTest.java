import com.mobi.rdf.orm.impl.ThingFactory;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;

@RunWith(BlockJUnit4ClassRunner.class)
public class OrmEnabledTestCaseTest extends OrmEnabledTestCase {

    @Test
    public void test() {
        Assert.assertFalse(this.valueConverters.isEmpty());
        Assert.assertFalse(this.ormFactories.isEmpty());
        Assert.assertTrue(ormFactories.get(0) instanceof ThingFactory);
        ormFactories.get(0  ).
    }

}
